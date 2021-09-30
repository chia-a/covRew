import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

# The pipeline trains a Random Forest classifier to predict the label, after various pre-processing operations
# (including two slicing operations with two selection conditions)

data = pd.read_csv('data/diabetes.csv')

# projection
data = data[['time_in_hospital', 'num_lab_procedures', 'num_procedures', 'insulin', 'num_medications',	'number_diagnoses', 'number_outpatient', 'number_emergency', 'number_inpatient', 'race', 'gender', 'age', 'readmitted']]

# filtering
data = data.loc[(data['number_emergency'] < 2) & (data['time_in_hospital'] > 5)]

# OneHotEncoder on insulin
data = pd.concat([data[['time_in_hospital',	'num_lab_procedures', 'num_procedures',	'num_medications', 'number_diagnoses', 'number_emergency', 'number_inpatient', 'race', 'gender', 'readmitted']], pd.get_dummies(data['insulin'])], axis=1)

new_columns = list(data.columns)
new_columns.remove('readmitted')
new_columns.remove('race')
new_columns.remove('gender')

# filtering
data = data.loc[(data['number_diagnoses'] > 5) & (data['num_medications'] >= 23)]

# model
model = RandomForestClassifier()
model.fit(data[new_columns], data['readmitted'])
