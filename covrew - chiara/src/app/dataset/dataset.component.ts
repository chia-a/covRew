import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import Axios from 'axios';

@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.css']
})
export class DatasetComponent implements OnInit {

  constructor(private router: Router) { }


  addNewItem() {

    if (this.lista_as.length <= 1) {
      this.metadata_object['cc_global'] = $(".cc_row").map((i:any, x:any) => (
        {'AS': [this.lista_as[0]], 'value': [$(x).find('.cc_value').first().val()], 'num': $(x).find('.cc_num').first().val() }
      )).get()
      this.metadata_object['number_AS'] = this.lista_as
    }
    else {
      this.metadata_object['cc_global'] = $(".cc_row_parent").map((i:any, x:any) => (
        {'AS': [$(x).find('.form-control').first().val()], 'value': [$(x).find('.cc_value').first().val()], 'num': $(x).find('.cc_num').first().val() }
      )).get()
      this.metadata_object['number_AS'] = this.values_lista_as_global
    }

    this.router.navigate(['/script'], {state: {dataset: this.metadata_object} });
  }


  metadata_json = []
  metadata_object:any = {}
  counter:any = 0
  lista_as:string[] = []
  values_lista_as_global:any = []

  // cartesianProduct(arr1:any, arr2:any) {
  //    var res:any = [];
  //    for(let i = 0; i < arr1.length; i++){
  //       for(let j = 0; j < arr2.length; j++){
  //          res.push(
  //             [arr1[i]].concat(arr2[j])
  //          );
  //       };
  //    };
  //    return res;
  // };


// funzione che combina gli elementi in un vettore: serve per avere le combinazioni deli AS
  getCombinations(valuesArray: String[]){
    var combi = [];
    var temp = [];
    var slent = Math.pow(2, valuesArray.length);

    for (var i = 0; i < slent; i++){
        temp = [];
        for (var j = 0; j < valuesArray.length; j++){
            if ((i & Math.pow(2, j))) {
                temp.push(valuesArray[j]);
            }
        }
        if (temp.length > 0){
            combi.push(temp);
        }
    }

    combi.sort((a, b) => a.length - b.length);
    return combi;
  }


  // funzione che combina gli elementi in più vettori: serve per avere le combinazioni dei valori dei vari AS
   arrayCombine (array:any) {
      if (array.length > 1) {
          var result = new Array();

          //This combines all the arrays except the first
          var otherCombs = this.arrayCombine(array.slice(1));

          for (var n = 0; n < array[0].length; n++)
              for (var i = 0; i < otherCombs.length; i++)
                  result.push(array[0][n] +','+ otherCombs[i]);
          return result;
      }

      //If we have only one array, the result is the array itself, for it contains in itself all the combinations of one element that can be made
      else return array[0];
  }



  updateInfoDataset(value:any) {
    $(".added").remove()
    $(".added_as").remove()
    $("#lista_AS").addClass("hidden")
    $("#select-AS").addClass("hidden")
    $("#cc_button").addClass("hidden")
    $("#container_CC").empty()
    $("#select-AS").prop('disabled', false)



    this.metadata_object = this.metadata_json.find((x:any) => x['dataset_name'] == value.value)

    var dataset_name = this.metadata_object ? this.metadata_object['dataset_name'] : ''

    $("#info-dataset").append(`
      <div class="box added" >
          <label>Dataset description</label>:
           ${this.metadata_object ? this.metadata_object['dataset_description'] : ''}
      </div>
      <div class="box added">
          <label>Attributes</label>:
          <ul>
            ${this.metadata_object ? (<any> this.metadata_object['attributes']).map((x:any) => `<li>
              <b>${x["name"]}</b>:
               ${x["description"] }
            </li> ` ).join('') : ''}
          </ul>
      </div>`)

  $("#select-AS").prop('selectedIndex',0)

    $("#select-AS").append(`
      ${this.metadata_object ? (<any> this.metadata_object['attributes']).map((x:any) => x["values"] ? `<option value="${x["name"]}" class="added" >
         ${x["name"] } </option> ` : "").join('') : ''}
    `)

    this.lista_as = []
    $("#select-AS").removeClass("hidden")
    $("#button_next_dataset").prop('disabled', true)

    this.metadata_object['dataset_name'] = dataset_name
  console.log(this.metadata_object['dataset_name'])
  }



  updateInfoAS(value:any) {

    // $(".added_as").remove()
    // $("#container_CC").empty()
    var attribute = this.metadata_object ? (<any> this.metadata_object["attributes"]).find((x:any) => x['name'] == value.value) : {}
    var attr_values = attribute ? attribute["values"] : []

      $("#lista_AS").append(`
        <div class = "added_as" id="${attribute['name']}">
          <span>
            ${attribute['name']}
          </span>
          <div>
            <table class="table_AS_values_count">
              <tbody>
              ${attr_values ? attr_values.map((x:any) => `<tr>
                <td>${x.name} </td>
                <td>${x.count}</td>
                </tr> ` ).join('') : ''}
              </tbody>
            </table>
          </div>
        </div>`)

    this.lista_as.push(attribute['name'])
    $(`#select-AS option[value="${attribute['name']}"]`).prop('disabled', true)

    $("#lista_AS").removeClass("hidden")
    $("#cc_button").removeClass("hidden")

    // $("#select-cc").append(`
    //   <option value="${attribute["name"]}" class="added_as" >
    //      ${attribute["name"]} </option>`)
    //
    // $("#select-cc").removeClass("hidden")
  }




  addCC(){
     // lista_as contiene la lista degli as e la combinazione
     // values_lista_as è un oggetto con tutti i valori per ogni as scelto

     $("#button_next_dataset").prop('disabled', false)
     $("#select-AS").prop('disabled', true)

     console.log(this.lista_as)

     if (this.lista_as.length <= 1) {
       this.addCC_single()
     }
     else {
       // oggetti di array con i valori per poi fare combinazione
       var values_lista_as:any = []
       this.lista_as.forEach((element:any, i:any) => {
           var attribute = this.metadata_object ? (<any> this.metadata_object["attributes"]).find((x:any) => x['name'] == element) : {}
           var attr_values = attribute ? attribute["values"] : []

           var lista:any = []
           attr_values.forEach((val:any) => {
             lista.push([val['name']])
           });

           values_lista_as.push({'as' : attribute["name"], 'vals': lista})
       });


      //qui creo le varie combinazioni tra gli as e i relativi valori
      let combi = this.getCombinations(this.lista_as);
      var lista_as_combined:any = []

      //aggiungo la combinazione tra i valori
      combi.forEach((element, i)  => {
        lista_as_combined[i] = element.join('+')
        if (element.length > 1) {
          var vals_selected_as:any = []
          var combined_values:any = []
          for (var j = 0; j < element.length; j++){
            vals_selected_as[j] = values_lista_as.find((x:any) => x['as'] == element[j])['vals']
          }
          combined_values = this.arrayCombine(vals_selected_as)
          values_lista_as.push({'as' : element.join('+'), 'vals': combined_values})
        }
      });
      console.log(values_lista_as)
      // console.log(lista_as_combined)



      // aggiorno selettore con i valori e le combinazioni
      $("#container_CC").removeClass("hidden")
      $("#container_CC").append(`
        <div class="cc_row_parent" id="div-select-CC-${this.counter}">
          <div class="selettore" >
            <select class="form-control" id="select-CC-${this.counter}">
              <option value="" disabled selected>Select SA for CC</option>
              ${lista_as_combined.map((x:any) => `<option value="${x}">${x}</option>`).join('')}
            </select>
          </div>
        </div>
        `)

      this.values_lista_as_global = []
      this.values_lista_as_global = values_lista_as

      var fun = this.addCC_multi
      $(`#select-CC-${this.counter}`).change(function(){
          $(`#${this.id}`).prop('disabled', true)
          fun($(`#${this.id}`).val(), values_lista_as, this.id.split("-")[this.id.split("-").length-1])
       })

      this.counter += 1
    }

  }


  addCC_multi(value:any, values_lista_as:any, counter_div:any){

    var selected_as:any = values_lista_as.find((x:any) => x['as'] == value)

    $(`#div-select-CC-${counter_div}`).append(`
      <div class="row cc_row" id ="row-${counter_div}">
        <div class="col-sm-2">
        </div>
        <div class="col-sm-5">
          <select class="form-control form-control-sm cc_value" id="idselect-${counter_div}">
            <option value="" disabled selected>Select value</option>
          ${selected_as['vals'].map((x:any) => `<option value="${x}">${x}</option>`).join('')}
          </select>
        </div>
        <div class="col-sm-3">
          <input class="form-control form-control-sm cc_num" type="number" min="0" placeholder="Digit">
        </div>
        <div class="col-sm-2">
          <button type="button" class ="del_button" id ="del_button-${counter_div}"><i class="fas fa-times del-botton"></i></button>
        </div>
      </div>`)

      $(`#idselect-${counter_div}`).change(() =>{
        $(`#idselect-${counter_div}`).prop('disabled', true)
       })


      if ($(".cc_row_parent").length <= 1) {
        $(".del_button").addClass("hidden")
      }
      else {
          $(".del_button").removeClass("hidden")
      }

      $("#container_CC").removeClass("hidden")

      $(".del_button").click(function() {
         $(`#div-select-CC${this.id.substring(this.id.indexOf("-"))}`).remove()

           if ($(".cc_row_parent").length <= 1) {
             $(".del_button").addClass("hidden")
           }
      })

  }



  addCC_single(){

    var value:any = this.lista_as[0] //$('#select-AS').val()

    var attribute = this.metadata_object ? (<any> this.metadata_object["attributes"]).find((x:any) => x['name'] == value) : {}
    var attr_values = attribute ? attribute["values"] : []

    $("#container_CC").append(`
      <div class="row cc_row" id ="row-${this.counter}">
        <div class="col-sm-2">
        </div>
        <div class="col-sm-5">
          <select class="form-control form-control-sm cc_value" id="id-select-${this.counter}">
            <option value="" disabled selected>Select value</option>
            ${attr_values.map((x:any) => `<option value="${x.name}">${x.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-sm-3">
          <input class="form-control form-control-sm cc_num" type="number" min="0" placeholder="Digit">
        </div>
        <div class="col-sm-2">
          <button type="button" class ="del_button" id ="del_button-${this.counter}"><i class="fas fa-times del-botton"></i></button>
        </div>
      </div>`)

      $(`#id-select-${this.counter}`).change(() =>{
        $(`#id-select-${this.counter}`).prop('disabled', true)
       })

      if ($(".cc_row").length <= 1) {
        $(".del_button").addClass("hidden")
      }
      else {
          $(".del_button").removeClass("hidden")
      }


      $("#container_CC").removeClass("hidden")

      $(".del_button").click(function(){
         $(`#row${this.id.substring(this.id.indexOf("-"))}`).remove()

           if ($(".cc_row").length <= 1) {
             $(".del_button").addClass("hidden")
           }
      })

      this.counter += 1
  }



  ngOnInit(): void {

    Axios.get('http://localhost:5000/get_metadata').then((data:any) => {

      this.metadata_json = data.data

      this.metadata_json.forEach(
        (x:any) => {$('#select-dataset').append(`<option value="${x['dataset_name']}" >${x['dataset_name']}</option>`) }
      )

    })

  $("#button_next_dataset").prop('disabled', true)

  }

}
