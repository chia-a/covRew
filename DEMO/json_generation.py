
import numpy as np
import pandas as pd
import json


def main():
    nome_dataset = 'student-por'

    data = pd.read_csv('data/'+ nome_dataset+'.csv', sep=';')
    json_obj = {'dataset_name': nome_dataset.capitalize(), 'dataset_path': 'data/'+ nome_dataset+'.csv' , 'dataset_lenght': len(data),
    'scripts': [nome_dataset+'_script1.py', nome_dataset+'_script2.py', nome_dataset+'_script3.py'], 'attributes': [] }

    for i in data.columns:
        if(data[i].dtype == np.float64 or data[i].dtype == np.int64):
            json_obj['attributes'] += [{'name': i, 'type': 'numeric', 'max': data[i].describe()['max'], 'min': data[i].describe()['min'], 'description': ''}]
        else:
            obj=[]
            name_val, counts = np.unique(data[i].dropna().values,return_counts=True)
            for j in range(0, len(name_val)):
                obj.append({'name': name_val[j], 'count': int(counts[j])})
            json_obj['attributes'] += [{'name': i, 'type': 'categorical', 'values': obj, 'description': ''}]

    #print(json_obj)
    with open ('metadata/' + nome_dataset +'_metadata.json', 'w') as file:
        json.dump(json_obj, file, indent = 4)





if __name__ == '__main__':
    main()
