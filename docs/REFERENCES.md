# References

Research papers and sources used by PhishGuard, its IEEE paper (`paper/paper_v2.tex`) and the seminar report (`report/seminar_report_v3.tex`). Please verify each entry against the publisher page or Google Scholar before final submission.

## Phishing research papers (22)

1. R. Dhamija, J. D. Tygar, M. Hearst, "Why phishing works," *Proc. ACM CHI*, 2006, pp. 581–590.
2. S. Sheng, B. Wardman, G. Warner, L. F. Cranor, J. Hong, C. Zhang, "An empirical analysis of phishing blacklists," *Proc. CEAS*, 2009.
3. C. Whittaker, B. Ryner, M. Nazif, "Large-scale automatic classification of phishing pages," *Proc. NDSS*, 2010.
4. S. Garera, N. Provos, M. Chew, A. D. Rubin, "A framework for detection and measurement of phishing attacks," *Proc. ACM WORM*, 2007, pp. 1–8.
5. J. Ma, L. K. Saul, S. Savage, G. M. Voelker, "Beyond blacklists: Learning to detect malicious web sites from suspicious URLs," *Proc. ACM SIGKDD*, 2009, pp. 1245–1254.
6. A. Blum, B. Wardman, T. Solorio, G. Warner, "Lexical feature based phishing URL detection using online learning," *Proc. ACM AISec*, 2010, pp. 54–60.
7. R. Verma, K. Dyer, "On the character of phishing URLs: Accurate and robust statistical learning classifiers," *Proc. ACM CODASPY*, 2015, pp. 111–122.
8. M. N. Feroz, S. Mengel, "Phishing URL detection using URL ranking," *Proc. IEEE Int. Congress on Big Data*, 2015, pp. 635–638.
9. O. K. Sahingoz, E. Buber, O. Demir, B. Diri, "Machine learning based phishing detection from URLs," *Expert Systems with Applications*, vol. 117, pp. 345–357, 2019.
10. D. Sahoo, C. Liu, S. C. H. Hoi, "Malicious URL detection using machine learning: A survey," arXiv:1701.07179, 2017.
11. A. Prasad, S. Chandra, "PhiUSIIL: A diverse security profile empowered phishing URL detection framework based on similarity index and incremental learning," *Computers & Security*, vol. 136, art. 103545, 2024.
12. A. C. Bahnsen, E. C. Bohorquez, S. Villegas, J. Vargas, F. A. González, "Classifying phishing URLs using recurrent neural networks," *Proc. APWG eCrime*, 2017, pp. 1–8.
13. H. Le, Q. Pham, D. Sahoo, S. C. H. Hoi, "URLNet: Learning a URL representation with deep learning for malicious URL detection," arXiv:1802.03162, 2018.
14. Y. Zhang, J. I. Hong, L. F. Cranor, "CANTINA: A content-based approach to detecting phishing web sites," *Proc. WWW*, 2007, pp. 639–648.
15. G. Xiang, J. Hong, C. P. Rose, L. Cranor, "CANTINA+: A feature-rich machine learning framework for detecting phishing web sites," *ACM TISSEC*, vol. 14, no. 2, art. 21, 2011.
16. R. M. Mohammad, F. Thabtah, L. McCluskey, "Intelligent rule-based phishing websites classification," *IET Information Security*, vol. 8, no. 3, pp. 153–160, 2014.
17. R. M. Mohammad, F. Thabtah, L. McCluskey, "Predicting phishing websites based on self-structuring neural network," *Neural Computing and Applications*, vol. 25, no. 2, pp. 443–458, 2014.
18. N. Abdelhamid, A. Ayesh, F. Thabtah, "Phishing detection based associative classification data mining," *Expert Systems with Applications*, vol. 41, no. 13, pp. 5948–5959, 2014.
19. R. S. Rao, A. R. Pais, "Detection of phishing websites using an efficient feature-based machine learning framework," *Neural Computing and Applications*, vol. 31, no. 8, pp. 3851–3873, 2019.
20. S. Marchal, G. Armano, T. Gröndahl, K. Saari, N. Singh, N. Asokan, "Off-the-hook: An efficient and usable client-side phishing prevention application," *IEEE Trans. Computers*, vol. 66, no. 10, pp. 1717–1733, 2017.
21. A. Y. Fu, L. Wenyin, X. Deng, "Detecting phishing web pages with visual similarity assessment based on earth mover's distance (EMD)," *IEEE TDSC*, vol. 3, no. 4, pp. 301–311, 2006.
22. I. Fehérvári, S. Appalaraju, "Scalable logo recognition using proxies," *Proc. IEEE WACV*, 2019, pp. 715–725.

## Methods and standards

23. L. Breiman, "Random forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.
24. F. Pedregosa et al., "Scikit-learn: Machine learning in Python," *JMLR*, vol. 12, pp. 2825–2830, 2011.
25. C. E. Shannon, "A mathematical theory of communication," *Bell System Technical Journal*, vol. 27, no. 3, pp. 379–423, 1948.
26. T. Berners-Lee, R. Fielding, L. Masinter, "Uniform Resource Identifier (URI): Generic syntax," RFC 3986, IETF, 2005.

## Dataset note

The model in this repository is trained on a **synthetic, script-generated corpus** (`backend/training/generate_dataset.py`), even though the file is named after the public PhiUSIIL dataset (UCI #967, Prasad & Chandra, ref. 11). Use `backend/training/dataset_loader.py` to download the real data.
