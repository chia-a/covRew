import json
import os
import ast
#import random
from coverage_rewriting import query_rewrite_CC


def getBinaryOp(op):
    if type(op) == ast.BitAnd:
        return ' AND '
    elif type(op) == ast.BitOr:
        return ' OR '
    else:
        raise Exception('Unknown Binary Operator')

def getAstBinaryOp(op):
    if op == ' AND ':
        return ast.BitAnd()
    elif op == ' OR ':
        return ast.BitOr()
    else:
        raise Exception('Unknown Binary Operator')

def getOp(op):
    if type(op) == ast.Gt:
        return '>'
    elif type(op) == ast.GtE:
        return '>='
    elif type(op) == ast.Lt:
        return '<'
    elif type(op) == ast.LtE:
        return '<='
    else:
        raise Exception('Unknown Operator')


def getAstOp(op):
    if op == '>':
        return ast.Gt()
    elif op == '>=':
        return ast.GtE()
    elif op == '<':
        return ast.Lt()
    elif op == '<=':
        return ast.LtE()
    else:
        raise Exception('Unknown Operator')


def getFilters(filename):
# nello script non ci devono essere funzioni
    with open('script/'+filename) as file:
        info = ast.parse(file.read())
        #print(ast.dump(info, indent = 4))

        datasets = []
        filters = []
        for i, line in enumerate(info.body):
            #print(line.lineno)
            if type(line) == ast.Assign:
                if type(line.value) == ast.Call and type(line.value.func) == ast.Attribute and line.value.func.attr == 'read_csv':
                    datasets += [line.targets[0].id]

                if type(line.value) == ast.Subscript and type(line.value.value) == ast.Attribute and type(line.value.value.value) == ast.Name and line.value.value.value.id in datasets:
                    if line.targets[0].id not in datasets:
                        datasets += [line.targets[0].id]
                    #print(ast.dump(line, indent = 4))

                    #cicliamo binOp finchè non troviamo Compare()
                    slice = line.value.slice
                    list_of_filter = [line.value.slice]
                    while type(slice) == ast.BinOp:
                        slice = slice.left
                        list_of_filter += [slice]
                    #print(list_of_filter)
                    #filters += []


                    filters += [{ 'line_number': line.lineno, 'data': line.value.value.value.id, 'conditions': [], 'binary_op': None if len(list_of_filter) == 1 else getBinaryOp(list_of_filter[0].op) }]
                    for val in list_of_filter[:-1]:
                        filters[-1]['conditions'] += [{'attr': val.right.left.slice.value, 'op': getOp(val.right.ops[0]), 'constant': val.right.comparators[0].value }]

                    filters[-1]['conditions'] += [{'attr': list_of_filter[-1].left.slice.value, 'op': getOp(list_of_filter[-1].ops[0]), 'constant': list_of_filter[-1].comparators[0].value }]

        #print({'filename': filename, 'filters': filters})
        return {'filename': filename, 'filters': filters}





def rewriteExecute(rewQueries):
    print(rewQueries)

    with open('script/'+rewQueries["filename"]) as file:
        info = ast.parse(file.read())

        datasets = []
        filters = []
        count = 0 # we count the number of rewritten queries
        scope = {} #ci serve per eseguire
        final_metadata = [] # metadata da aggiungere a lista perche potrebbero essere piu di uno
        for i, line in enumerate(info.body):
            #print(ast.dump(line, indent = 4))

            # controlliamo di non andare oltre l'ultima query da riscrivere
            if line.lineno > rewQueries["filters"][-1]["line_number"]:
                break

            # riscriviamo oppure eseguiamo
            if line.lineno == rewQueries["filters"][count]["line_number"]:

                data = scope[rewQueries["filters"][count]["data"]]

                # restituisce query riscritta come oggetto
                rewritten_query, metadata_cmg, res_data = query_rewrite_CC(data, rewQueries["filters"][count])
                print(rewritten_query)
                print(metadata_cmg)
                print(res_data)
                # in metadata_cmg: card_as_initial e card_as_final sono liste perchè potrebbero esserci più vincoli


                # 1) modifichiamo la query con quella riscritta, modificando line
                if rewritten_query != None:
                    #print(ast.dump(line, indent = 4))
                    slice = ast.Compare(left=ast.Subscript(value=ast.Name(id=rewQueries["filters"][count]["data"], ctx=ast.Load()),
                                                           slice= ast.Constant(value=rewritten_query[0]['attr']),
                                                           ctx= ast.Load()),
                                        ops= [getAstOp(rewritten_query[0]['op'])],
                                        comparators= [ast.Constant(value=float(rewritten_query[0]['constant']))])

                    for cond in range(1, len(rewritten_query)):
                        slice = ast.BinOp(left = ast.Compare(left=ast.Subscript(value=ast.Name(id=rewQueries["filters"][count]["data"], ctx=ast.Load()),
                                                                                slice= ast.Constant(value=rewritten_query[cond]['attr']),
                                                                                ctx=ast.Load()),
                                                             ops= [getAstOp(rewritten_query[cond]['op'])],
                                                             comparators= [ast.Constant(value=float(rewritten_query[cond]['constant']))]),
                                          op = getAstBinaryOp(rewQueries["filters"][count]["binary_op"]),
                                          right = slice)

                    #line.value.slice = ast.copy_location(slice, line.value.slice)
                    line.value.slice = slice
                    line = ast.fix_missing_locations(line)

                    #print('info', rewQueries["filters"][count]["line_number"])
                    print(ast.unparse(line))

                    metadata_cmg['CC'] = rewQueries["filters"][count]["CC"]
                    print(metadata_cmg)
                    final_metadata += [{"line_number": rewQueries["filters"][count]["line_number"], "cmg_info":metadata_cmg, "new_line":ast.unparse(line)}]
                else:
                    final_metadata += [{"line_number": rewQueries["filters"][count]["line_number"], "cmg_info":res_data}]



                # 2) eseguiamo la linea
                c = compile(ast.Module([line], type_ignores=[]), filename =' ', mode = 'exec')
                exec(c, scope)

                print('sono andato oltre')

                count += 1

            else:
                # compile prende un modulo ast
                c = compile(ast.Module([line], type_ignores=[]), filename =' ', mode = 'exec')
                exec(c, scope)
                #print('entra in else')

            print(final_metadata)
        return final_metadata
