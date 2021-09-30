import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

# The pipeline trains a Random Forest model to predict the label, after various pre-processing operations
# (including four slicing operations with a variable number of selection conditions)

data = pd.read_csv('data/diabetes.csv')

# filtering
data = data.loc[(data['num_medications'] < 25) & (data['num_medications'] > 10)]

# projection
data = data[['time_in_hospital', 'num_lab_procedures', 'num_procedures', 'insulin', 'num_medications',	'number_diagnoses', 'number_outpatient', 'number_emergency', 'number_inpatient', 'race', 'gender', 'age', 'readmitted']]

# filtering
data = data.loc[(data['time_in_hospital'] < 8)]

# drop missing values entries
print('current data size after removing uncomplete rows', len(data))
object_col = data.select_dtypes(include=object).columns.tolist()
object_col.remove('race')
object_col.remove('gender')
object_col.remove('readmitted')
for col in object_col:
    data.loc[data[col] =='?', col] = np.nan
data = data.dropna(axis=0, how='any')
print('data size after removing rows missing values', len(data), data.columns)

# filtering
data = data.loc[(data['time_in_hospital'] > 5) | (data['number_diagnoses'] > 5) | (data['num_medications'] >= 23)]

# drop race from data
data = data.drop('race', axis=1)

# OneHotEncoder on insulin
data = pd.concat([data[['time_in_hospital',	'num_lab_procedures', 'num_procedures',	'num_medications',	'number_outpatient', 'number_emergency', 'number_inpatient', 'gender', 'readmitted']], pd.get_dummies(data['insulin'])], axis=1)

new_columns = list(data.columns)
new_columns.remove('readmitted')
new_columns.remove('gender')

# filtering
data = data.loc[(data['num_lab_procedures'] < 30)]

# model
model = RandomForestClassifier()
model.fit(data[new_columns], data['readmitted'])
