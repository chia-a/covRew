import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.svm import SVC

# The pipeline trains a SVC model to predict the label, after various pre-processing operations
# (including two slicing operations with two selection conditions)

data = pd.read_csv('data/adult.csv')

# projection
data = data[['age', 'education_num', 'fnlwgt', 'race', 'sex', 'capital_gain', 'capital_loss', 'hours_per_week', 'marital_status','label']]

# filtering
data = data.loc[(data['hours_per_week'] <= 70) & (data['capital_gain'] > 200)]

# OneHotEncoder on marital_status
data = pd.concat([data[['age', 'education_num', 'fnlwgt', 'race', 'sex', 'capital_gain', 'capital_loss', 'hours_per_week','label']], pd.get_dummies(data['marital_status'])], axis=1)

new_columns = list(data.columns)
new_columns.remove('label')
new_columns.remove('race')
new_columns.remove('sex')

# filtering
data = data.loc[(data['education_num'] >= 15) & (data['hours_per_week'] > 40)]

# model
model = SVC()
model.fit(data[new_columns], data['label'])
