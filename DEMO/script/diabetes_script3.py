import numpy as np
import pandas as pd
from sklearn.svm import SVC

# The pipeline trains a SVC model to predict the label, after various pre-processing operations
# (including two slicing operations with up to four afiltering conditions)

data = pd.read_csv('data/diabetes.csv')

# filtering
data = data.loc[(data['number_emergency'] < 8) & (data['num_procedures'] < 5)]

# projection
data = data[['time_in_hospital', 'num_lab_procedures', 'num_procedures', 'insulin', 'num_medications',	'number_diagnoses', 'number_outpatient', 'number_emergency', 'number_inpatient', 'race', 'gender', 'age', 'readmitted']]

# drop insulin from data
data = data.drop('insulin', axis=1)

# filtering
data = data.loc[(data['number_emergency'] < 5) & (data['num_lab_procedures'] > 40) & (data['num_medications'] < 10) & (data['time_in_hospital'] < 3)]

# model
model = SVC()
model.fit(data[['time_in_hospital', 'num_lab_procedures', 'num_procedures', 'num_medications', 'number_diagnoses', 'number_outpatient', 'number_emergency', 'number_inpatient']], data['readmitted'])
