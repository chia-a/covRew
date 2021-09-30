import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# The pipeline trains a Random Forest classifier to predict the label, after various pre-processing operations
# (including two slicing operations with up to four afiltering conditions)

data = pd.read_csv('data/adult.csv')

# drop missing values entries
data.dropna(axis=1,inplace=True)

# filtering
data = data.loc[(data['hours_per_week'] > 30) & (data['hours_per_week'] < 60)]

# projection
data = data[['id','age', 'fnlwgt','education_num', 'race', 'sex', 'capital_gain', 'capital_loss', 'hours_per_week','label']]

# drop fnlwgt from data
data = data.drop('fnlwgt', axis=1)

# filtering
data = data.loc[(data['capital_gain'] > 2500) | (data['capital_loss'] > 2500) | (data['education_num'] > 14) | (data['age'] > 50)]

# model
model = RandomForestClassifier()
model.fit(data[['age', 'education_num', 'capital_gain', 'capital_loss', 'hours_per_week']], data['label'])
