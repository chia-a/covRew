import numpy as np
import pandas as pd

data = pd.read_csv('data/student-mat.csv', sep=';')

# projection
# data = data[['age', 'education_num', 'fnlwgt', 'race', 'sex', 'capital_gain', 'capital_loss', 'hours_per_week', 'marital_status','label']]

# filtering
data = data.loc[(data['G3'] <= 6) & (data['absences'] <= 3)]
