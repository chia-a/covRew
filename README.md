# covRew

covRew is a Python toolkit for rewriting slicing operations in pre-processing pipelines so that the pipeline execution ensures that protected groups are adequately represented (i.e.,covered) in the result. 

The toolkit includes: (i) an analyzer, which identifies candidate operations for rewriting; (ii) a rewriter, which transforms operations for ensuring coverage satisfaction with respect to user specifiedconstraints; (iii) an impact evaluator, allowing the user to assess the impact of the rewriting on the obtained results.
Further details are available in [3].

This project was developed with Python 3 and Angular 11.2.1.


## Organization of the repository

There are two main folders:
- covrew - chiara contains the project developed in Angular 
- DEMO contains all the files for parsing the given pipeline, identifying the filtering operations and calling the rewriting algorithm so that the result will satisfy the constraint (see [3] for further details)

US Adult Census and Diabetes US are the available datasets and the proposed pipeline refer to them. Obviously you can add your dataset in the data folder and specify your pipeline.


## References

[1] Coverage-based Rewriting for Data Preparation. C. Accinelli, S. Minisi and B. Catania. EDBT/ICDT Workshops 2020

[2] The impact of rewriting on coverage constraint satisfaction. C. Accinelli, B. Catania, G. Guerrini and S. Minisi. EDBT/ICDT Workshops 2021.

[3] covRew: a Python Toolkit for Pre-Processing Pipeline Rewriting Ensuring Coverage Constraint Satisfaction. C. Accinelli, B. Catania, G. Guerrini and S. Minisi. EDBT 2021.
