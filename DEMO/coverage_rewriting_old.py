import psycopg2
import re
import itertools
import numpy as np
import sys
import math
from functools import reduce
import pandas as pd
import pandas.io.sql as sqlio
from scipy.stats import norm
import json

sys.setrecursionlimit(1000000000)

np.set_printoptions(suppress=True)
np.set_printoptions(threshold=sys.maxsize)

def selectivity(returned, total):
    return float(returned) / float(total)

def cardinality_estimation(sample, table_size, q, sens_attr, sens_values):
    sample_result_g = sample.query(q)
    est_sel_g = float(sample_result_g.shape[0]) /float(sample.shape[0])
    #est_sel_g = selectivity(sample_result_g.shape[0], sample.shape[0])
    est_card_g = int(est_sel_g * table_size)

    sens_values_count = []
    for sens_val in sens_values:
        #sens_values_count.append(int(table_size * selectivity(sample_result_g.query(sens_attr + ' == \'' + sens_val + '\'').shape[0], sample.shape[0])))
        sens_values_count.append(int(table_size * float(sample_result_g.query(sens_attr + ' == \'' + sens_val + '\'').shape[0]) / float(sample.shape[0])))
    return (est_card_g, tuple(sens_values_count))


def compute_sample_size(MCE, CL):
    return math.ceil(((norm.ppf(1 - (1 - CL)/2)**2)*(0.5**2))/MCE**2)


def min_max(sample, attrs):
    result = []
    for a in attrs:
        result += [{'attr': a,'min': sample[a].min(), 'max': sample[a].max()}]
    return result

def get_minimum(dist):
    m = dist[0]
    for v in dist[1:]:
        if v['dist'] < m['dist']:
            m = v
    return m

def compute_distance(t):
    return np.linalg.norm(t)

def compare_tuples(t1, t2, fun):
    return all(map(fun, t1, t2))

def is_locked(t, lock):
    return any(map(lambda x: compare_tuples(t, x, lambda a, b: a >= b), lock))

def can_not_have_solutions(t, dont_have_solutions):
    return any(map(lambda x: compare_tuples(t, x, lambda a, b: a <= b), dont_have_solutions))



def is_locked_axes(t, lock):
    return list(filter(lambda x: compare_tuples(t, x[1], lambda a, b: a >= b), lock))

def can_not_have_solutions_axes(t, dont_have_solutions):
    return list(filter(lambda x: compare_tuples(t, x[1], lambda a, b: a <= b), dont_have_solutions))



def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]  #yield genera iteratore


# se il numero di bin non è lo stesso su tutti gli assi, si va in diagonale, fino a quando questa esiste...
def diagonal_search(k, sample, card_tot, relax_attributes, sens_attr, boolean_op):

    high_min = min(len(x['bins']) for x in relax_attributes)
    high_max = max(len(x['bins']) for x in relax_attributes)

    high = tuple([high_min-1]*len(relax_attributes))
    low = tuple([0]*len(relax_attributes))
    count_stime = 0

    query = get_query(relax_attributes, boolean_op, low)
    res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), low)

    count_stime = count_stime + 1
    if all([x >= k[[*k][i]] for i, x in enumerate(res[0][1])]):
    # if res[0][1][0] >= k['card']:
        return ((res[0][1], res[0][0]), low), None, count_stime

    query = get_query(relax_attributes, boolean_op, high)
    res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), high)
    count_stime = count_stime + 1

    # se high non rispetta il vincolo
    if any([x < k[[*k][i]] for i, x in enumerate(res[0][1])]):
        #se gli attributi sono discretizzati con diverso numero di bin
        if high_min != high_max:
            #considera la cella piu' in alto a destra possibile
            new_high = tuple([len(x['bins'])-1 for x in relax_attributes])
            query = get_query(relax_attributes, boolean_op, new_high)
            new_res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), new_high)
            count_stime = count_stime + 1
            #se il nuovo high non rispetta il vincolo, ritorniamo new_high
            if any([x < k[[*k][i]] for i, x in enumerate(new_res[0][1])]):
                return None, ((new_res[0][1], new_res[0][0]), tuple(new_res[1])), count_stime
            else:
                return ((new_res[0][1], new_res[0][0]), new_high), ((res[0][1], res[0][0]), tuple(res[1])), count_stime

        return None, ((res[0][1], res[0][0]), tuple(res[1])), count_stime
    last = res

    while any(x <= y for x, y in zip(low, high)):
        # mid = l + (r - l)/2;
        mid = tuple(a - b for a, b in zip(high, low))
        mid = tuple(int(i / 2) for i in mid)
        mid = tuple(a + b for a, b in zip(low, mid))
        query = get_query(relax_attributes, boolean_op, mid)
        res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), mid)
        count_stime = count_stime + 1

        if all([x >= k[[*k][i]] for i, x in enumerate(res[0][1])]):
        # if res[0][1][0] >= k['card']:
            high = tuple(i - 1 for i in mid)
            last = tuple(res)
        else:
            low = tuple(i + 1 for i in mid)

    if any([x < k[[*k][i]] for i, x in enumerate(last[0][1])]):
    # if last[0][1][0] < k['card']:
        return None, ((last[0][1], last[0][0]), tuple(last[1])), count_stime
    else:
        last_1 = tuple(x-1 for x in last[1])
        query = get_query(relax_attributes, boolean_op, last_1)
        res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), last_1)
        count_stime = count_stime + 1
        return ((last[0][1], last[0][0]), last[1]), ((res[0][1], res[0][0]), tuple(res[1])) , count_stime

def axes_search(k, sample, card_tot, relax_attributes, sens_attr, boolean_op):
    #in lock ci sarà 1 cella per ogni asse
    locks = []
    #in no_sols_tot ci saranno da 1 a 2 celle per ogni asse
    no_sols_tot = []
    count_stime = 0
    for i, v in enumerate(relax_attributes):
        no_sols = []
        j = 0
        while j < min([len(x['bins']) for x in relax_attributes]):
            high = [j]*len(relax_attributes)
            high[i] = len(relax_attributes[i]['bins']) - 1

            loock = is_locked_axes(high, locks)
            if len(loock) > 0:
                high[i] = min(map(lambda x: x[1][i], loock)) - 1

            high = tuple(high)
            low = [j]*len(relax_attributes)
            low[i] = 0

            no_sool = can_not_have_solutions_axes(low, no_sols_tot)
            if len(no_sool) > 0:
                low[i] = max(map(lambda x: x[1][i], no_sool)) + 1

            if low[i] >= len(relax_attributes[i]['bins']):
                break

            low = tuple(low)
            query = get_query(relax_attributes, boolean_op, low)

            res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), low)
            count_stime = count_stime + 1
            if all([x >= k[[*k][i]] for i, x in enumerate(res[0][1])]):
            # if res[0][1][0] >= k['card']:
                locks.append(((res[0][1], res[0][0]), low))
                break

            query = get_query(relax_attributes, boolean_op, high)
            res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), high)
            count_stime = count_stime + 1
            if any([x < k[[*k][i]] for i, x in enumerate(res[0][1])]):
            # if res[0][1][0] < k['card']:
                no_sols = [((res[0][1], res[0][0]), high)]
                j += 1
                continue

            last = res
            while low[i] < high[i]:
                # mid = l + (r - l)/2;
                mid = [j] * len(relax_attributes)
                mid[i] = int((high[i] - low[i])/2)
                mid[i] = low[i] + mid[i]
                mid = tuple(mid)
                query = get_query(relax_attributes, boolean_op, mid)
                res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), mid)
                count_stime = count_stime + 1

                if all([x >= k[[*k][i]] for i, x in enumerate(res[0][1])]):
                # if res[0][1][0] >= k['card']:
                    high = [j]*len(relax_attributes)
                    high[i] = mid[i] - 1
                    high = tuple(high)
                    last = tuple(res)
                else:
                    low = [j]*len(relax_attributes)
                    low[i] = mid[i] + 1
                    low = tuple(low)

            if all([x >= k[[*k][i]] for i, x in enumerate(last[0][1])]):
            # if last[0][1][0] >= k['card']:
                old_res = ((last[0][1], last[0][0]), last[1])
                idx_lock = list(last[1])
                idx_lock[i] -= 1
                idx_lock = tuple(idx_lock)
                query = get_query(relax_attributes, boolean_op, idx_lock)
                res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), idx_lock)
                count_stime += 1
                while idx_lock[i] > 0 and all([x >= k[[*k][i]] for i, x in enumerate(res[0][1])]):
                # while idx_lock[i] > 0 and res[0][1][0] >= k['card']:
                    old_res = ((res[0][1], res[0][0]), res[1])
                    idx_lock = list(idx_lock)
                    idx_lock[i] -= 1
                    idx_lock = tuple(idx_lock)
                    query = get_query(relax_attributes, boolean_op, idx_lock)
                    res = (cardinality_estimation(sample, card_tot, query, sens_attr, [*k]), idx_lock)
                    count_stime += 1
                locks.append(old_res)
                if idx_lock[i] >= 0:
                    no_sols.append(((res[0][1], res[0][0]), res[1]))
            j += 1
        no_sols_tot += no_sols
    return locks, no_sols_tot, count_stime

def unique(x):
    return list(dict.fromkeys(x))

def minimum_index_2(k, locks, nosols, sample, card_tot, relax_attributes, sens_attr, boolean_op, n_bin, iter):
    #in LOCK e DONT_HAVE_SOLUTIONS salvo solo gli indici delle celle (no cardinalita' stimate)

    lock = [x[1] for x in locks]
    lock = unique(lock)

    min_lock = locks[0]
    for a in locks[1:]:
        if a[0][1] < min_lock[0][1]:
            min_lock = a
    # MINIMUMS = ((CARDINALITA_SENS, CARDINALITA_TOT), DIST, INDEX)
    minimums = [(min_lock[0], compute_distance(min_lock[1]), min_lock[1])]
    #if all([x >= k[[*k][i]] for i, x in enumerate(minimums[0][0][0])]):
    #    return minimums, 0

    dont_have_solutions = [x[1] for x in nosols]
    dont_have_solutions = unique(dont_have_solutions)
    # in MIN_LOCK salvo il minimo con anche le cardinalita'


#   min_i e max_i ....
    min_i = [-1]*len(relax_attributes)
    max_i = [len(x['bins']) for x in relax_attributes]

    if iter:
        current_fraction = n_bin / 2
    else:
        current_fraction = 1

    count = 0
    #CURRENT_FRACTION mi serve per...
    while current_fraction > 0:
        new_lock = []
        for lk in lock:
            if not is_locked(lk, new_lock):
                new_lock = list(filter(lambda x: not is_locked(x, [lk]), new_lock))
                new_lock.append(lk)
        lock = new_lock
        #print('lock ', lock)
        new_nosols = []
        for lk in dont_have_solutions:
            if not can_not_have_solutions(lk, new_nosols):
                new_nosols = list(filter(lambda x: not can_not_have_solutions(x, [lk]), new_nosols))
                new_nosols.append(lk)
        dont_have_solutions = new_nosols
        #print('dont_have_sol ', dont_have_solutions)

    # while current_fraction <= n_bin:
        #print('Building tovisit', current_fraction, n_bin)
        for x in lock:
            if x.count(0) == len(x) - 1:
                new_max = [(i, v) for i, v in enumerate(x) if v > 0][0]
                max_i[new_max[0]] = new_max[1]

        for x in dont_have_solutions:
            if [a==len(b['bins'])-1 for a,b in zip(x, relax_attributes)].count(True) == len(x) - 1:
                new_min = [(i, v) for i, v in enumerate(x) if v < len(relax_attributes[i]['bins']) - 1][0]
                min_i[new_min[0]] = new_min[1]

        #min_max_idx = [[x - 1 for x in list(filter(lambda a: a % current_fraction == 0, range(1, n_bin + 1)))] for i in relax_attributes]
        min_max_idx = [unique([0]+ [x - 1 for x in list(filter(lambda a: a % current_fraction == 0, range(1, len(i['bins']) + 1)))]) for i in relax_attributes]

        # print(pd.MultiIndex.from_product(min_max_idx, names=['i_' + str(x) for x in range(0, len(relax_attributes))]))
        #print(min_max_idx)
        min_max_idx = [list(filter(lambda y: y > min_i[i] and y < max_i[i], x)) for i, x in enumerate(min_max_idx)]
        min_max_idx = pd.MultiIndex.from_product(min_max_idx, names=['i_' + str(x) for x in range(0, len(relax_attributes))])
        to_visit = pd.DataFrame(index=min_max_idx)

        #print(q)

        # lock.sort(key = lambda a: math.sqrt(sum([a[i]*a[i] for i in range(0, len(relax_attributes))])))
        for chunk in chunks(lock, 10):
            q_lock = ') & ('.join([' | '.join(['i_' + str(j) + ' < ' + str(y) for j, y in enumerate(x)]) for x in chunk])
            if q_lock != '':
                q_lock = '(' + q_lock + ')'
            to_visit = to_visit.query(q_lock)

        for chunk in chunks(dont_have_solutions, 10):
            q_dont_have_solutions = ') & ('.join([' | '.join(['i_' + str(j) + ' > ' + str(y) for j, y in enumerate(x)]) for x in chunk])
            if q_dont_have_solutions != '':
                q_dont_have_solutions = '(' + q_dont_have_solutions + ')'
            to_visit = to_visit.query(q_dont_have_solutions)

        if len(to_visit) > 0:
            #to_visit['dist'] = to_visit.eval('sqrt(' + ' + '.join(['i_' + str(x) + '*' + 'i_' + str(x) for x in range(0, len(relax_attributes))]) + ')')
            for idx_p,p in enumerate(relax_attributes):
                #to_visit['v_'+str(idx_p)] = to_visit.index.map(lambda x: (p['bins'][x[idx_p]] - p['min_bin'])/ (p['max_bin'] - p['min_bin']) if (p['bins'][x[idx_p]] - p['min_bin']) != 0 else 0)

                to_visit['v_'+str(idx_p)] = to_visit.index.map(lambda x: abs(p['op_dist'] - ((p['bins'][x[idx_p]] - p['min_bin'])/ (p['max_bin'] - p['min_bin']))) if (p['max_bin'] - p['min_bin']) != 0 else 0)
            to_visit['dist'] = to_visit.eval('sqrt(' + ' + '.join(['v_' + str(x) + '*' + 'v_' + str(x) for x in range(0, len(relax_attributes))]) + ')')
            to_visit.sort_values(by='dist', inplace=True)


        # current_fraction -= 1
        current_fraction = int(current_fraction/2)

        while len(to_visit) > 0:

            # Prendi l'indice della cella dal min heap
            u = to_visit.iloc[0]
            u_i = to_visit.index[0]
            u = (u['dist'], u_i)
            to_visit = to_visit.iloc[1:]

            #if not is_locked(u[1], lock):
            count = count + 1
            query = get_query(relax_attributes, boolean_op, u[1])
            # Stima della cardinalità delle query sull'attributo sensibile e su tutta la query rilassata
            est = cardinality_estimation(sample, card_tot, query, sens_attr, [*k])
            est = (est[1], est[0])
            #print(u[1], '; ', est)
            # Se rispetta il vincolo di cardinalità
            if all([x >= k[[*k][i]] for i, x in enumerate(est[0])]):
            # if est[0] >= k['card']:

                # Se la cardinalità stimata globale è minore del minimo trovato fin'ora
                if est[1] < minimums[0][0][1] or (est[1] == minimums[0][0][1] and u[0] < minimums[0][1]):
                    # Diventa il nuovo minimo
                    minimums = [(est, u[0], u[1])]
                # Se è uguale
                elif est[1] == minimums[0][0][1] and u[0] == minimums[0][1]:
                    # Aggiungo alla lista dei minimi
                    minimums.append((est, u[0], u[1]))
                # Aggiungi la cella a quelle locking
                lock = [x for x in lock if not is_locked(x, [u[1]])]
                lock.append(u[1])

                q_lock = ' | '.join(['i_' + str(j) + ' < ' + str(y) for j, y in enumerate(u[1])])
                to_visit = to_visit.query(q_lock)


            elif est[1] >= minimums[0][0][1]:
                lock = [x for x in lock if not is_locked(x, [u[1]])]
                lock.append(u[1])
                q_lock = ' | '.join(['i_' + str(j) + ' < ' + str(y) for j, y in enumerate(u[1])])
                to_visit = to_visit.query(q_lock)
                dont_have_solutions = [x for x in dont_have_solutions if not can_not_have_solutions(x, [u[1]])]
                dont_have_solutions.append(u[1])
            else:
                dont_have_solutions = [x for x in dont_have_solutions if not can_not_have_solutions(x, [u[1]])]
                dont_have_solutions.append(u[1])

    return minimums, count

def compute_bins_qcut(relax_attributes, n_bin, sample):
    for j, v in enumerate(relax_attributes):
        if v['op'] in ['<', '<=']:
            relax_attributes[j]['op_dist'] = 0
            if sample[v['attr']][sample[v['attr']] >= float(v['val'])].unique().size > 1:
                _,dim_bin = pd.qcut(sample[v['attr']][sample[v['attr']] >= float(v['val'])], q = n_bin-1, duplicates='drop', retbins=True)#.unique()
                dim_bin = dim_bin.tolist()
            else:
                #dim_bin = [float(v['val']), v['max']]
                dim_bin = [float(v['val']), max(v['max'], float(v['val']))]
        else:
            relax_attributes[j]['op_dist'] = 1
            if sample[v['attr']][sample[v['attr']] <= float(v['val'])].unique().size > 1:
                _,dim_bin = pd.qcut(sample[v['attr']][sample[v['attr']] <= float(v['val'])], q = n_bin-1, duplicates='drop', retbins=True)#.unique()
                dim_bin = dim_bin.tolist()
            else:
                #dim_bin = [v['min'], float(v['val'])]
                dim_bin = [min(v['min'], float(v['val'])), float(v['val'])]

            dim_bin = dim_bin[::-1]

        dim_bin[0] = float(v['val'])

        if len(set(dim_bin)) == 1:
            relax_attributes[j]['bins'] = dim_bin + dim_bin
            #del relax_attributes[j]
        else:
            relax_attributes[j]['bins'] = dim_bin

    return relax_attributes


def compute_bins_distinct(relax_attributes, n_bin, sample):
    for j, v in enumerate(relax_attributes):
        #contare distinct val
        distinct_val = len(sample[v['attr']].unique())
        n_bin_attr = min(n_bin, distinct_val)

        if v['op'] in ['<', '<=']:
            relax_attributes[j]['op_dist'] = 0
            step = (v['max'] - float(v['val'])) / (n_bin_attr - 1)
            dim_bin = [float(v['val']) + step *i for i in range(0, n_bin_attr)]
        else:
            relax_attributes[j]['op_dist'] = 1
            step = (float(v['val']) - v['min']) / (n_bin_attr - 1)
            dim_bin = [float(v['val']) - step *i for i in range(0, n_bin_attr)]

        #relax_attributes[j]['bins'] = dim_bin

        #dim_bin = list(set(dim_bin))

        if len(set(dim_bin)) == 1:
            relax_attributes[j]['bins'] = dim_bin + dim_bin
        else:
            relax_attributes[j]['bins'] = dim_bin
    return relax_attributes


def compute_bins_base(relax_attributes, n_bin, sample):
    for j, v in enumerate(relax_attributes):
        #contare distinct val
        n_bin_attr = min(n_bin, len(sample[v['attr']]))

        if v['op'] in ['<', '<=']:
            relax_attributes[j]['op_dist'] = 0
            step = (float(v['max']) - float(v['val'])) / (n_bin_attr - 1)
            dim_bin = [float(v['val']) + step *i for i in range(0, n_bin_attr)]
        else:
            relax_attributes[j]['op_dist'] = 1
            step = (float(v['val']) - float(v['min'])) / (n_bin_attr - 1)
            dim_bin = [float(v['val']) - step *i for i in range(0, n_bin_attr)]

        #dim_bin = list(set(dim_bin))

        if len(set(dim_bin)) == 1:
            relax_attributes[j]['bins'] = dim_bin + dim_bin
        else:
            relax_attributes[j]['bins'] = dim_bin
    return relax_attributes


def get_query(relax_attributes, op, index):
    cond = []
    for j, v in enumerate(relax_attributes):
        cond += [v['attr'] + ' ' + v['op'] + ' ' + str(v['bins'][index[j]]) ]
    cond_str = op.join(cond)
    return cond_str

def get_query_result(relax_attributes, op, index):
    cond = []
    for j, v in enumerate(relax_attributes):
        if v['min_bin'] == v['max_bin']:
            cond += [v['attr'] + ' ' + v['op'] + ' ' + str(v['val_orig']) ]
        else:
            cond += [v['attr'] + ' ' + v['op'] + ' ' + str(v['bins'][index[j]]) ]
    cond_str = op.join(cond)
    return cond_str


################################################################################
## MEASURES
def calc_min(bins_list):
    min_val = abs(bins_list[1] - bins_list[0])
    for i in range(2, len(bins_list)):
        if abs(bins_list[i] - bins_list[i-1]) < min_val:
            min_val = abs(bins_list[i] - bins_list[i-1])
    return min_val

def calc_max(bins_list):
    max_val = abs(bins_list[1] - bins_list[0])
    for i in range(2, len(bins_list)):
        if abs(bins_list[i] - bins_list[i-1]) > max_val:
            max_val = abs(bins_list[i] - bins_list[i-1])
    return max_val

def calc_mean(bins_list):
    sum = 0

    for i in range(1, len(bins_list)):
        sum +=  abs(bins_list[i] - bins_list[i-1])
    return sum/(len(bins_list)-1)

def calc_min_max_mean_tot(json_obj, fun, n_bin, val_dataset):
    celle = []
    sum = 0
    new_bins_json = []
    for i in json_obj:
        celle += [range(0,len(set(i['bins'])))]

        curr_min = min(i['bins'])
        curr_max = max(i['bins'])

        new_bins = [0]
        if curr_min != curr_max:
            for j in range(1, len(i['bins'])):
                new_bins += [abs(((i['bins'][j] - curr_min)/(curr_max-curr_min)) - ((i['bins'][j-1] - curr_min)/(curr_max-curr_min)))]

        new_bins_json += [new_bins]

    to_visit = list(itertools.product(*celle))[1:]

    sols = []
    for i in to_visit:
        count = 0
        for j,e in enumerate(i):
            count += new_bins_json[j][e]**2
        sols += [math.sqrt(count)]
    return fun(sols)/math.sqrt(len(json_obj))


def calc_min_max_mean_tot_sol(json_obj, sol, n_bin, val_dataset):
    sum = 0
    new_sol = re.split(', ',sol[1:-1])
    num = 0
    for i in json_obj:
        curr_min = min(i['bins'])
        curr_max = max(i['bins'])

        new_bins = [0]
        if curr_min != curr_max:
            for j in range(1, len(i['bins'])):
                new_bins += [abs(((i['bins'][j] - curr_min)/(curr_max-curr_min)) - ((i['bins'][j-1] - curr_min)/(curr_max-curr_min)))]

        idx_sol= int(new_sol[num])
        sol_val = new_bins[idx_sol]
        num += 1

        sum += sol_val**2
    return math.sqrt(sum)/math.sqrt(len(json_obj))


def proximity(json_obj, sol, n_bin, val_dataset):
    new_sol = re.split(', ',sol[1:-1])
    norm_vals_sol = []
    num = 0
    for i in json_obj:
        print(i, new_sol)
        curr_min = min(i['bins'])
        curr_max = max(i['bins'])
        print(curr_min, curr_max)

        norm_vals_bins = []
        if curr_min != curr_max:
            for j in range(0, len(i['bins'])):
                if i['op'] in ['<', '<=']:
                    norm_vals_bins += [((i['bins'][j] - curr_min)/(curr_max-curr_min))]
                else:
                    norm_vals_bins += [((curr_max - i['bins'][j])/(curr_max-curr_min))]
        else:
            norm_vals_bins = [0]

        idx_sol= int(new_sol[num])
        norm_vals_sol += [norm_vals_bins[idx_sol]]
        num += 1

# CALCOLO DISTANZA TRA Q e Qnew
    sum = 0.0
    for ii in range(0, len(norm_vals_sol)):
        sum += norm_vals_sol[ii]**2
    return math.sqrt(sum)/math.sqrt(len(json_obj))


###############################################################################
def cmg_query_ref(sample, relax_attributes, boolean_op, table_size, sample_size, n_bin, sens_attr, k, prep):#, pruning, iter):

    orig_query = boolean_op.join([x['attr'] + ' ' + x['op'] + ' ' + x['val_orig'] for x in relax_attributes])

    sens_attr_values = sample[sens_attr].unique()
    sens_attr_counts = {}
    init_card_est = cardinality_estimation(sample, table_size, orig_query, sens_attr, sens_attr_values)
    print('La cardinalità stimata per la query originale è:', init_card_est[0] , init_card_est[1] , '\n')

    card_est_max_as = list(init_card_est[1])
    sens_attr_ests = init_card_est[1]

    for v, e in zip(sens_attr_values, sens_attr_ests):
        sens_attr_counts[v] = e


#################################### PREPROCESSING #################################
    for i, mm in enumerate(min_max(sample, list(map(lambda x: x['attr'], relax_attributes)))):
        relax_attributes[i]['min'] = float(mm['min'])
        relax_attributes[i]['max'] = float(mm['max'])

        if float(relax_attributes[i]['val_orig']) > relax_attributes[i]['max']:
            relax_attributes[i]['val'] = str(relax_attributes[i]['max'])
        if float(relax_attributes[i]['val_orig']) < relax_attributes[i]['min']:
            relax_attributes[i]['val'] = str(relax_attributes[i]['min'])


    if prep == 'base':
        relax_attributes = compute_bins_base(relax_attributes, n_bin, sample)
    if prep == 'distinct':
        relax_attributes = compute_bins_distinct(relax_attributes, n_bin, sample)
    if prep == 'qcut':
        relax_attributes = compute_bins_qcut(relax_attributes, n_bin, sample)


    for i, m in enumerate(relax_attributes):
        relax_attributes[i]['min_bin'] = min(relax_attributes[i]['bins'])
        relax_attributes[i]['max_bin'] = max(relax_attributes[i]['bins'])

        print('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', k, sens_attr_counts)
    #if sens_attr_counts[[*k][0]] >= k[[*k][0]]:
    if all([sens_attr_counts[x] >= k[x] for i, x in enumerate([*k]) ]):
        return {'cmg_info': relax_attributes, 'n_bin': n_bin, 'solution_idx': "The coverage constraint is already satisfied", 'orig_query': orig_query}

############ PRUNING ####################
    locks = []
    nosols = []

    #if pruning:
    locks_axes, nosols_axes, count_stime_locks_search = axes_search(k, sample, table_size, relax_attributes, sens_attr, boolean_op)
    locks = locks_axes
    nosols = nosols_axes

    l_node, nosols_diag, count_stime_diagonal_search = diagonal_search(k, sample, table_size, relax_attributes, sens_attr, boolean_op)
    if l_node != None:
        locks.append(l_node)
    if nosols_diag != None:
        nosols.append(nosols_diag)

    # print(sens_attr_counts[[*k][0]])
    # print(k[[*k][0]])


    # print(locks, nosols)
    if locks == []:
        return  {'cmg_info': relax_attributes, 'n_bin': n_bin, 'solution_idx': "It is not possible to rewrite the query", 'orig_query': orig_query}



########### ALGO ##########################
    min_idx, count_q = minimum_index_2(k, locks, nosols, sample, table_size, relax_attributes, sens_attr, boolean_op, n_bin, iter)

    new_query = get_query_result(relax_attributes, boolean_op, min_idx[0][2])

    return {'cmg_info': relax_attributes, 'n_bin': n_bin, 'solution_idx': min_idx[0][2], 'orig_query': orig_query, 'new_query': new_query}







def query_rewrite_CC(data, info_query):
    print(info_query)

    # algo
    n_bin = 32 #16
    prep = 'qcut'  #'base' 'distinct' 'qcut'
    #pruning = True
    #iter = True


    relax_attributes = []
    for i in info_query['conditions']:
        relax_attributes.append(
        {
            'attr': i['attr'],
            'op': i['op'],
            'val_orig': str(i['constant']),
            'val': str(i['constant'])
        })


    #boolean_op_init = info_query['binary_op']
    boolean_op = ''
    if (' OR ' in info_query['binary_op'] or ' or ' in info_query['binary_op']) and (' AND ' in info_query['binary_op'] or ' and ' in info_query['binary_op']):
        print('Conditions must be all ANDs or all ORs!')
        exit(1)
    elif ' OR ' in info_query['binary_op']:
        boolean_op = ' | '
    elif ' AND ' in info_query['binary_op']:
        boolean_op = ' & '

######### vincoli
    sens_attr = info_query['CC'][0]['AS']
    k ={}

    for i in info_query['CC']:
        sens_val = i['value']
        cc = int(i['num'])
        k[sens_val] = cc

    # SAMPLE
    sample_size = compute_sample_size(0.01, 0.99)
    if info_query['fast_execution'] == 'True' and len(data)>sample_size:
        print(info_query['fast_execution'])
        print(info_query['fast_execution'] == 'True')
        sample = data.sample(n=sample_size)
    else:
        sample = data
    table_size = len(data)
    sample_size = len(sample)


    if sens_attr not in sample.columns:
        metadata_cmg = {'cmg_info': relax_attributes, 'n_bin': n_bin, 'solution_idx': "The sensitive attribute is not present in the projection of the data", 'orig_query': boolean_op.join([x['attr'] + ' ' + x['op'] + ' ' + x['val_orig'] for x in relax_attributes])}
    else:
        # rewriting
        metadata_cmg = cmg_query_ref(sample, relax_attributes, boolean_op, table_size, sample_size, n_bin, sens_attr, k, prep)


    # OUTPUT
    # in rewritten query there is the new query
    # in metadata_cmg the are metadata
    # res_data is the result dataframe

    # cardinalità iniziali per tutti
    data_orig = data.query(metadata_cmg['orig_query'])
    card_vera_tot_Q = len(data_orig)
    card_vera_as_Q = []
    for x in k:
        card_vera_as_Q.append(len(data.query('('+ metadata_cmg['orig_query']  + ') & ' + sens_attr +' == \'' + x + '\'')))

    metadata_cmg['card_tot_init'] = card_vera_tot_Q
    metadata_cmg['card_as_init'] = card_vera_as_Q


    if metadata_cmg['solution_idx'] == "The coverage constraint is already satisfied" or metadata_cmg['solution_idx'] == "It is not possible to rewrite the query" or metadata_cmg['solution_idx'] == "The sensitive attribute is not present in the projection of the data":
        rewritten_query = None
        res_data = metadata_cmg['solution_idx']
    else:
        # 1) rewritten query
        rewritten_query = info_query['conditions']
        for i, v in enumerate(rewritten_query):
            v['constant'] = relax_attributes[i]['bins'][metadata_cmg['solution_idx'][i]]

        # 3) result dataset
        res_data = data.query(metadata_cmg['new_query'])

        # 2) computation of measures
        card_vera_tot_newQ = len(res_data)
        card_vera_as_newQ = []
        for x in k:
            card_vera_as_newQ.append(len(data.query('('+ metadata_cmg['new_query']  + ') & ' + sens_attr +' == \'' + x + '\'')))

        metadata_cmg['card_tot_final'] = card_vera_tot_newQ
        metadata_cmg['card_as_final'] = card_vera_as_newQ
        metadata_cmg['relaxation_degree'] = (card_vera_tot_newQ - card_vera_tot_Q) /card_vera_tot_Q
        metadata_cmg['diag_min'] = calc_min_max_mean_tot(metadata_cmg['cmg_info'], min, metadata_cmg['n_bin'], '')
        metadata_cmg['diag_max'] = calc_min_max_mean_tot(metadata_cmg['cmg_info'], max, metadata_cmg['n_bin'],  '')
        metadata_cmg['diag_sol'] = calc_min_max_mean_tot_sol(metadata_cmg['cmg_info'], str(metadata_cmg['solution_idx']), metadata_cmg['n_bin'],'')
        metadata_cmg['proximity'] = proximity(metadata_cmg['cmg_info'], str(metadata_cmg['solution_idx']), metadata_cmg['n_bin'],'')


        for j, v in enumerate(metadata_cmg['cmg_info']):
            v['new_val'] = v['bins'][metadata_cmg['solution_idx'][j]]
            ### salvo i bin per fare istogrammi
            print(res_data[v['attr']].unique())
            n_bins = min(30, len(res_data[v['attr']].unique() ))
            # res_data_bins = min(30, len(res_data[v['attr']].unique() ))
            print(np.histogram(res_data[v['attr']], bins=n_bins))
            v['hist_bin_prima'] = list([float(y) for y in list(x)] for x in zip(np.histogram(data_orig[v['attr']], bins=np.histogram(res_data[v['attr']], bins=n_bins)[1])[0],np.histogram(data_orig[v['attr']], bins=np.histogram(res_data[v['attr']], bins=n_bins)[1])[1]))
            v['hist_bin_dopo'] = list([float(y) for y in list(x)] for x in zip(np.histogram(res_data[v['attr']], bins=n_bins)[0], np.histogram(res_data[v['attr']], bins=n_bins)[1]))


        # print(metadata_cmg)

    return rewritten_query, metadata_cmg, res_data

if __name__ == '__main__':
    pass
