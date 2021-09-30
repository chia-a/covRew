import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

# The pipeline trains a Random Forest model to predict the label, after various pre-processing operations
# (including four slicing operations with a variable number of selection conditions)


data = pd.read_csv('data/adult.csv')

# filtering
data = data.loc[(data['hours_per_week'] <= 50) | (data['capital_gain'] > 2000)]

# drop missing values entries
print('current data size after removing uncomplete rows', len(data))
object_col = data.select_dtypes(include=object).columns.tolist()
for col in object_col:
    data.loc[data[col] =='?', col] = np.nan
data = data.dropna(axis=0, how='any')
print('data size after removing rows missing values', len(data))

# filtering
data = data.loc[(data['age'] >= 40) & (data['capital_gain'] < 50000)]

# projection
data = data[['age', 'education_num', 'fnlwgt', 'race', 'sex', 'capital_gain', 'capital_loss', 'hours_per_week', 'workclass','label']]

# filtering
data = data.loc[(data['education_num'] >= 15) & (data['hours_per_week'] > 28) & (data['age'] <= 50)]

# drop race from data
data = data.drop('race', axis=1)

# OneHotEncoder on workclass
data = pd.concat([data[['age', 'education_num', 'fnlwgt','sex','capital_gain', 'capital_loss', 'hours_per_week','label']], pd.get_dummies(data['workclass'])], axis=1)

new_columns = list(data.columns)
new_columns.remove('label')
new_columns.remove('sex')

# filtering
data = data.loc[(data['capital_loss'] < 5000) & (data['capital_loss'] > 20)]

# model
model = RandomForestClassifier()
model.fit(data[new_columns], data['label'])
