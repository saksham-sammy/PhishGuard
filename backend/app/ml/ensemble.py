"""
PhishGuard-Stack: Dual-Modal Domain-Disjoint Out-of-Fold Calibrated Heterogeneous
Stacking Ensemble with Sub-Millisecond Instance-Level Feature Attribution.

Fuses two strictly fetch-free URL representations:
  1. Multi-View Explicit Deception & Divergence Vector (48 features across
     Classical, Public-Suffix Topology, Homoglyph Brand-Spoofing, and Dirichlet
     KL-Divergence views) modeled by Linear, Bagged-Tree, and Histogram-Boosted
     base learners.
  2. Subword Character n-Gram Morphology (n in {3,4,5}, sublinear TF-IDF) modeled
     by an L2-regularized linear margin learner.

All base learners are combined via Registrable-Domain-Disjoint Out-of-Fold
Sigmoid Meta-Stacking with epistemic disagreement gating.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin, clone
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedGroupKFold, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def _prob_to_logit(p: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    clipped = np.clip(p, eps, 1.0 - eps)
    return np.log(clipped / (1.0 - clipped))


class PhishGuardStackClassifier(BaseEstimator, ClassifierMixin):
    """
    Proposed PhishGuard-Stack Dual-Modal Fetch-Free Classifier.
    """

    def __init__(
        self,
        n_splits: int = 5,
        rf_estimators: int = 200,
        hgb_max_iter: int = 260,
        max_char_ngrams: int = 22000,
        random_state: int = 42,
    ) -> None:
        self.n_splits = n_splits
        self.rf_estimators = rf_estimators
        self.hgb_max_iter = hgb_max_iter
        self.max_char_ngrams = max_char_ngrams
        self.random_state = random_state

    def _build_tabular_estimators(self) -> Dict[str, Any]:
        return {
            "lr": Pipeline(
                [
                    ("scaler", StandardScaler()),
                    (
                        "clf",
                        LogisticRegression(
                            C=1.0,
                            max_iter=1000,
                            class_weight="balanced",
                            random_state=self.random_state,
                        ),
                    ),
                ]
            ),
            "rf": RandomForestClassifier(
                n_estimators=self.rf_estimators,
                max_depth=24,
                min_samples_leaf=2,
                class_weight="balanced",
                n_jobs=-1,
                random_state=self.random_state,
            ),
            "hgb": HistGradientBoostingClassifier(
                max_iter=self.hgb_max_iter,
                learning_rate=0.06,
                max_depth=12,
                min_samples_leaf=15,
                l2_regularization=1.0,
                random_state=self.random_state,
            ),
        }

    def _build_char_pipeline(self) -> Pipeline:
        return Pipeline(
            [
                (
                    "tfidf",
                    TfidfVectorizer(
                        analyzer="char",
                        ngram_range=(3, 5),
                        min_df=3,
                        max_features=self.max_char_ngrams,
                        sublinear_tf=True,
                        lowercase=True,
                    ),
                ),
                (
                    "clf",
                    LogisticRegression(
                        C=2.5,
                        max_iter=1000,
                        class_weight="balanced",
                        random_state=self.random_state,
                    ),
                ),
            ]
        )

    @staticmethod
    def _construct_meta_features(
        p_lr: np.ndarray,
        p_rf: np.ndarray,
        p_hgb: np.ndarray,
        p_char: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        if p_char is not None:
            probs = np.column_stack([p_lr, p_rf, p_hgb, p_char])
        else:
            probs = np.column_stack([p_lr, p_rf, p_hgb])
        logits = _prob_to_logit(probs)
        disagreement = np.std(probs, axis=1, keepdims=True)
        return np.hstack([probs, logits, disagreement])

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        groups: Optional[np.ndarray] = None,
        urls: Optional[Sequence[str]] = None,
    ) -> "PhishGuardStackClassifier":
        X_arr = np.asarray(X, dtype=np.float64)
        y_arr = np.asarray(y, dtype=np.int64)
        self.classes_ = np.array([0, 1], dtype=np.int64)
        self.n_features_in_ = X_arr.shape[1]
        self.has_char_branch_ = urls is not None
        urls_arr = np.asarray(urls, dtype=object) if urls is not None else None

        templates = self._build_tabular_estimators()
        n_samples = X_arr.shape[0]
        oof_lr = np.zeros(n_samples, dtype=np.float64)
        oof_rf = np.zeros(n_samples, dtype=np.float64)
        oof_hgb = np.zeros(n_samples, dtype=np.float64)
        oof_char = np.zeros(n_samples, dtype=np.float64) if self.has_char_branch_ else None

        if groups is not None:
            splitter = StratifiedGroupKFold(
                n_splits=self.n_splits, shuffle=True, random_state=self.random_state
            )
            split_iter = list(splitter.split(X_arr, y_arr, groups))
        else:
            splitter = StratifiedKFold(
                n_splits=self.n_splits, shuffle=True, random_state=self.random_state
            )
            split_iter = list(splitter.split(X_arr, y_arr))

        for tr_idx, val_idx in split_iter:
            X_tr, y_tr = X_arr[tr_idx], y_arr[tr_idx]
            X_val = X_arr[val_idx]

            m_lr = clone(templates["lr"]).fit(X_tr, y_tr)
            m_rf = clone(templates["rf"]).fit(X_tr, y_tr)
            m_hgb = clone(templates["hgb"]).fit(X_tr, y_tr)

            oof_lr[val_idx] = m_lr.predict_proba(X_val)[:, 1]
            oof_rf[val_idx] = m_rf.predict_proba(X_val)[:, 1]
            oof_hgb[val_idx] = m_hgb.predict_proba(X_val)[:, 1]

            if self.has_char_branch_ and urls_arr is not None and oof_char is not None:
                m_char = self._build_char_pipeline().fit(urls_arr[tr_idx], y_tr)
                oof_char[val_idx] = m_char.predict_proba(urls_arr[val_idx])[:, 1]

        # Fit tabular-only fallback combiner AND full dual-modal combiner
        meta_tab = self._construct_meta_features(oof_lr, oof_rf, oof_hgb, None)
        self.meta_tabular_ = LogisticRegression(
            C=1.5, max_iter=1000, random_state=self.random_state
        ).fit(meta_tab, y_arr)

        if self.has_char_branch_ and oof_char is not None:
            meta_full = self._construct_meta_features(oof_lr, oof_rf, oof_hgb, oof_char)
            self.meta_learner_ = LogisticRegression(
                C=1.5, max_iter=1000, random_state=self.random_state
            ).fit(meta_full, y_arr)
            self.char_model_ = self._build_char_pipeline().fit(urls_arr, y_arr)
        else:
            self.meta_learner_ = self.meta_tabular_
            self.char_model_ = None

        # Fit final tabular base learners on full training set
        self.lr_model_ = clone(templates["lr"]).fit(X_arr, y_arr)
        self.rf_model_ = clone(templates["rf"]).fit(X_arr, y_arr)
        # Switch RF to single-thread post-fit so single-URL inference avoids thread-spawn latency
        self.rf_model_.n_jobs = 1
        self.hgb_model_ = clone(templates["hgb"]).fit(X_arr, y_arr)

        # Learn benign-centroid distributional parameters & hybrid attribution sensitivities
        benign_mask = y_arr == 0
        phish_mask = y_arr == 1
        self.benign_mean_ = np.mean(X_arr[benign_mask], axis=0)
        self.phish_mean_ = np.mean(X_arr[phish_mask], axis=0)
        self.feature_std_ = np.where(np.std(X_arr, axis=0) > 1e-6, np.std(X_arr, axis=0), 1.0)
        self.polarity_ = np.where(self.phish_mean_ >= self.benign_mean_, 1.0, -1.0)

        lr_coef = self.lr_model_.named_steps["clf"].coef_[0]
        rf_imp = self.rf_model_.feature_importances_

        lr_abs_norm = np.abs(lr_coef) / max(float(np.sum(np.abs(lr_coef))), 1e-9)
        rf_imp_norm = rf_imp / max(float(np.sum(rf_imp)), 1e-9)

        self.lr_signed_norm_ = lr_coef / max(float(np.sum(np.abs(lr_coef))), 1e-9)
        self.tree_imp_norm_ = rf_imp_norm
        self.feature_importances_ = 0.35 * lr_abs_norm + 0.65 * rf_imp_norm

        return self

    def predict_base_proba(
        self, X: np.ndarray, urls: Optional[Sequence[str]] = None
    ) -> Dict[str, np.ndarray]:
        X_arr = np.asarray(X, dtype=np.float64)
        p_lr = self.lr_model_.predict_proba(X_arr)[:, 1]
        p_rf = self.rf_model_.predict_proba(X_arr)[:, 1]
        p_hgb = self.hgb_model_.predict_proba(X_arr)[:, 1]
        out: Dict[str, np.ndarray] = {"lr": p_lr, "rf": p_rf, "hgb": p_hgb}
        if self.has_char_branch_ and self.char_model_ is not None and urls is not None:
            p_char = self.char_model_.predict_proba(list(urls))[:, 1]
            out["char_ngram"] = p_char
            out["disagreement"] = np.std(
                np.column_stack([p_lr, p_rf, p_hgb, p_char]), axis=1
            )
        else:
            out["disagreement"] = np.std(np.column_stack([p_lr, p_rf, p_hgb]), axis=1)
        return out

    def predict_proba(
        self, X: np.ndarray, urls: Optional[Sequence[str]] = None
    ) -> np.ndarray:
        base = self.predict_base_proba(X, urls=urls)
        if "char_ngram" in base:
            meta_X = self._construct_meta_features(
                base["lr"], base["rf"], base["hgb"], base["char_ngram"]
            )
            return self.meta_learner_.predict_proba(meta_X)
        meta_X = self._construct_meta_features(base["lr"], base["rf"], base["hgb"], None)
        return self.meta_tabular_.predict_proba(meta_X)

    def predict(
        self, X: np.ndarray, urls: Optional[Sequence[str]] = None
    ) -> np.ndarray:
        probs = self.predict_proba(X, urls=urls)[:, 1]
        return (probs >= 0.5).astype(np.int64)

    def explain_instance(
        self,
        x_row: List[float] | np.ndarray,
        feature_names: List[str],
        url: Optional[str] = None,
        top_k: int = 6,
    ) -> Dict[str, Any]:
        """
        Compute exact base-model breakdown and top-k signed instance-level feature
        attributions psi_j(x) relative to the learned benign feature centroid.
        """
        x_vec = np.asarray(x_row, dtype=np.float64).reshape(1, -1)
        url_seq = [url] if url is not None else None
        base = self.predict_base_proba(x_vec, urls=url_seq)

        if "char_ngram" in base:
            meta_X = self._construct_meta_features(
                base["lr"], base["rf"], base["hgb"], base["char_ngram"]
            )
            p_stack = float(self.meta_learner_.predict_proba(meta_X)[0, 1])
        else:
            meta_X = self._construct_meta_features(
                base["lr"], base["rf"], base["hgb"], None
            )
            p_stack = float(self.meta_tabular_.predict_proba(meta_X)[0, 1])

        z_benign = np.clip((x_vec[0] - self.benign_mean_) / self.feature_std_, -6.0, 6.0)
        psi = 0.45 * (self.lr_signed_norm_ * z_benign) + 0.55 * (
            self.tree_imp_norm_ * self.polarity_ * z_benign
        )

        order = np.argsort(np.abs(psi))[::-1][:top_k]
        attributions = []
        for idx in order:
            score = float(psi[idx])
            if abs(score) < 1e-4:
                continue
            attributions.append(
                {
                    "feature": feature_names[idx],
                    "value": round(float(x_vec[0, idx]), 4),
                    "benign_baseline": round(float(self.benign_mean_[idx]), 4),
                    "contribution": round(score, 4),
                    "direction": "phishing" if score > 0 else "benign",
                }
            )

        breakdown: Dict[str, float] = {
            "logistic_regression": round(float(base["lr"][0]), 4),
            "random_forest": round(float(base["rf"][0]), 4),
            "hist_gradient_boosting": round(float(base["hgb"][0]), 4),
        }
        if "char_ngram" in base:
            breakdown["char_ngram_margin"] = round(float(base["char_ngram"][0]), 4)
        breakdown["epistemic_disagreement"] = round(float(base["disagreement"][0]), 4)
        breakdown["calibrated_stack"] = round(p_stack, 4)

        return {
            "ensemble_breakdown": breakdown,
            "feature_attributions": attributions,
        }
