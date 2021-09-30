import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Axios from 'axios';
import { Location } from '@angular/common';

@Component({
  selector: 'app-vincoli',
  templateUrl: './vincoli.component.html',
  styleUrls: ['./vincoli.component.css']
})
export class VincoliComponent implements OnInit {

  existing_filters = []
  rewriting_lines:any = []

  constructor(private router: Router, private location: Location) { }


  addNewItemStatistics() {

    this.info_for_rewriting['filename'] = this.metadata_object["selected_script"]
    this.info_for_rewriting['filters'] = []

    if (this.metadata_object['number_AS'].length <= 1){
        this.selected_lines.map((x:any, i:any) => (
          this.existing_filters.forEach((y:any) => {

            var cc:any = []

            cc.push( $(`.cc_row_input-${x}`).map((ii:any, xx:any) => (
              { 'AS': [this.metadata_object['number_AS'][0]], 'value': [$(xx).find('.cc_value_input').first().val()], 'num': $(xx).find('.cc_num_input').first().val() }
            )).get()
            )


            if (x == y["line_number"]){
              this.info_for_rewriting['filters'].push(
                  {
                   'line_number': y["line_number"],
                   'data':  y["data"],
                   'conditions' : y["conditions"],
                   'binary_op': y["binary_op"],
                   'fast_execution': $(`#selected_execution_type_${x}`).val() == 'fast' ? 'True' : 'False',
                   'CC' : cc[0]
                 })
            }
          })
        ))
    }
    else { //combined as
      this.selected_lines.map((x:any, i:any) => (
        this.existing_filters.forEach((y:any) => {

          var cc_tmp:any = []
          var cc:any = []

          cc_tmp.push( $(`#container_tot_CC_input_${x} .cc_row_parent_vincoli`).map((ii:any, xx:any) => (
            {'AS': [$(xx).find('.cc_as_input').first().val()], 'value': [$(xx).find('.cc_value_input').first().val()], 'num': $(xx).find('.cc_num_input').first().val() }
          )).get()
          )


        cc_tmp[0].forEach((element:any, iii:any) => {
            if (element['AS'][0].split("+").length > 1) {
              cc.push({'AS': [element['AS'][0].split("+")[0], element['AS'][0].split("+")[1]], 'value':[element['value'][0].split(",")[0], element['value'][0].split(",")[1]] , 'num': element['num']})
            }
            else {
              cc.push({'AS': element['AS'], 'value': element['value'], 'num': element['num']})
            }
        });


          if (x == y["line_number"]){
            this.info_for_rewriting['filters'].push(
                {
                 'line_number': y["line_number"],
                 'data':  y["data"],
                 'conditions' : y["conditions"],
                 'binary_op': y["binary_op"],
                 'fast_execution': $(`#selected_execution_type_${x}`).val() == 'fast' ? 'True' : 'False',
                 'CC' : cc
               })
          }
        })
      ))
    }

    console.log('output', this.info_for_rewriting)

    var pippo = history.state
    pippo['vincoli'] = this.info_for_rewriting

    this.router.navigate(['/statistiche'], {state: pippo})
  }

  back(){
    this.location.back()
  }

  addCC2_single(value:any, line_number:any, counter_div:any) {

    // var value:any = $(`#select-cc-input_${line_number}`).val()

    var attribute = this.metadata_object ? (<any> this.metadata_object["attributes"]).find((x:any) => x['name'] == value) : {}
    var attr_values = attribute ? attribute["values"] : []


    $(`#container_CC_input-${line_number}`).append(`
       <div class="row cc_row_input-${line_number}" id ="row-${counter_div}">
         <div class="col-sm-2">
         </div>
         <div class="col-sm-4">
         <select class="form-control form-control-sm cc_value_input" id="idselect-${counter_div}">
           <option value="" disabled selected>Select value</option>
           ${attr_values.map((x:any) => `<option value="${x.name}">${x.name}</option>`).join('')}
         </select>
         </div>
         <div class="col-sm-4">
           <input class="form-control form-control-sm cc_num_input" type="text" placeholder="Digit">
         </div>
         <div class="col-sm-2">
           <button type="button" class ="del_button_${line_number}" id ="del_button-${counter_div}"><i class="fas fa-times del-botton_${counter_div}"></i></button>
         </div>
       </div>`)

       $(`#idselect-${counter_div}`).change(() =>{
         $(`#idselect-${counter_div}`).prop('disabled', true)
        })


    if ($(`.cc_row_input-${line_number}`).length <= 1) {
       $(`.del_button_${line_number}`).addClass("hidden")
    }
    else {
         $(`.del_button_${line_number}`).removeClass("hidden")
    }

    $(`#del_button-${counter_div}`).click(function(){
        $(`#row${this.id.substring(this.id.indexOf("-"))}`).remove()

          if ($(`.cc_row_input-${line_number}`).length <= 1) {
            $(`.del_button_${line_number}`).addClass("hidden")
          }
    })

  }


  addCC2_multi(value:any, metadata:any, line_number:any, counter_div:any) {

    var selected_as:any = metadata.find((xxx:any) => xxx['as'] == value)

       $(`#div_select_CC${counter_div}`).append(`
           <div id ="container_CC_input${counter_div}">
             <div class="row cc_row_input${counter_div}" id ="row${counter_div}">
               <div class="col-sm-2"></div>
               <div class="col-sm-4">
                <select class="form-control form-control-sm cc_value_input" id="idselect${counter_div}">
                  <option value="" disabled selected>Select value</option>
                  ${selected_as['vals'].map((x:any) => `<option value="${x}">${x}</option>`).join('')}
               </select>
               </div>
               <div class="col-sm-4">
                 <input class="form-control form-control-sm cc_num_input" type="number" min ="0" placeholder="Digit">
               </div>
               <div class="col-sm-2">
                 <button type="button" class ="del_button_${line_number}" id ="del_button${counter_div}"><i class="fas fa-times del_botton${counter_div}"></i></button>
               </div>
             </div>
        </div>`)


        $(`#idselect${counter_div}`).change(() =>{
          $(`#idselect${counter_div}`).prop('disabled', true)
         })

        if ($(`#container_tot_CC_input_${line_number} .cc_row_parent_vincoli`).length <= 1) {
          $(`.del_button_${line_number}`).addClass("hidden")
        }
        else {
            $(`.del_button_${line_number}`).removeClass("hidden")
        }

        $(`#del_button${counter_div}`).click(function() {
           $(`#div_select_CC${counter_div}`).remove()

             if ($(`#container_tot_CC_input_${line_number} .cc_row_parent_vincoli`).length <= 1) {
               $(`.del_button_${line_number}`).addClass("hidden")
             }
        })
  }





  metadata_object:any = {}
  info_for_rewriting:any = {}
  selected_lines:any = [];

  counter:any = 0


  ngOnInit(): void {


    this.metadata_object = history.state.script

    console.log('input vincoli',this.metadata_object)
    $("#button_next_vincoli").prop('disabled', true)

    //LINEE FILTRI
    Axios.get(`http://localhost:5000/get_filters/${this.metadata_object['selected_script']}`).then((data:any) => {

       this.existing_filters = data.data.filters.filters

       //identification of filtering lines
       this.existing_filters.forEach(
         (x:any) => {
             $('#rewriting_lines').append(`
             <div id='container_line_${x['line_number']}'>
               <div class="form-check">
                 <input class="form-check-input lines_button" type="checkbox" name= "bottone_linea" value="${x['line_number']}" id="${x['line_number']}">
                   <label class="form-check-label" for="${x['line_number']}">
                    Line ${x['line_number']}
                   </label>
               </div>
               <div class= "container_input_lines">
                 <div class="selettore hidden" id="execution_type_${x['line_number']}" >
                   <div class="testo_titoletti_interni">Execution type:</div>
                   <select class="form-control form-control-sm" id="selected_execution_type_${x['line_number']}">
                     <option value="fast">Fast</option>
                     <option value="accurate">Accurate</option>
                   </select>
                 </div>
               </div>
             </div>
            `)


  // CASO 1 AS
       if (this.metadata_object['number_AS'].length <= 1){

         $(`#container_line_${x['line_number']} .container_input_lines`).append(`
           <div class ="hidden" id="cc_line_${x['line_number']}">
             <div class="testo_titoletti_interni">Coverage constraints:</div>
             <div id ="container_tot_CC_input_${x['line_number']}">
               <div class="selettore_cc_vincoli mb-2">
                 <select class="form-control form-control-sm" id = "select_cc_input-${x['line_number']}" disabled>
                   <option value="${this.metadata_object['number_AS'][0]}" class="added disabled">
                      ${this.metadata_object['number_AS'][0]} </option>
                   </select>
               </div>
               <div id ="container_CC_input-${x['line_number']}">  </div>
             </div>
             <div align=center>
               <button type="button" class="btn-lg bottoni" id="add_cc_${x['line_number']}">Modify coverage constraint set</button>
             </div>
           </div>
         `)

         this.metadata_object['cc_global'].forEach( (xx:any) => {

           $(`#container_CC_input-${x['line_number']}`).append(`
               <div class="row cc_row_input-${x['line_number']}" id ="row-${this.counter}">
                 <div class="col-sm-2">
                 </div>
                 <div class="col-sm-4">
                   <select class="form-control form-control-sm cc_value_input" placeholder="${xx['value'][0]}" disabled>
                    <option value="${xx['value'][0]}" class="added disabled">${xx['value'][0]}</option>
                   </select>
                 </div>
                 <div class="col-sm-4">
                   <input class="form-control form-control-sm cc_num_input" type="text" value="${xx['num']}" placeholder="${xx['num']}" disabled>
                 </div>
                 <div class="col-sm-2">
                   <button type="button" class ="del_button_${x['line_number']}" id ="del_button-${this.counter}"><i class="fas fa-times del-botton_${this.counter}"></i></button>
                 </div>
               </div>`)

           if ($(`.cc_row_input-${x['line_number']}`).length <= 1) {
             $(`.del_button_${x['line_number']}`).addClass("hidden")
           }
           else {
               $(`.del_button_${x['line_number']}`).removeClass("hidden")
           }

           $(`.del_button_${x['line_number']}`).click(function(){
              $(`#row${this.id.substring(this.id.indexOf("-"))}`).remove()

                if ($(`.cc_row_input-${x['line_number']}`).length <= 1) {
                  $(`.del_button_${x['line_number']}`).addClass("hidden")
                }
            })
           this.counter += 1

           })

           //se seleziono il bottone aggiungo i vincoli
           var button_add_cc:any = document.querySelector(`#add_cc_${x['line_number']}`);
           button_add_cc.addEventListener('click', (event:any) => {
              this.addCC2_single(this.metadata_object['number_AS'][0], x['line_number'], this.counter)
              this.counter += 1
           })
       }

    // CASO PIU' AS
       else {
         // preparo il selettore
         $(`#container_line_${x['line_number']} .container_input_lines`).append(`
           <div class ="hidden" id="cc_line_${x['line_number']}">
             <div class="testo_titoletti_interni">Coverage constraints:</div>
             <div id ="container_tot_CC_input_${x['line_number']}">
             </div>
             <div align=center>
               <button type="button" class="btn-lg bottoni" id="add_cc_${x['line_number']}">Modify coverage constraint set</button>
             </div>
           </div>
         `)

         // riempo il selettore con i cc dati
         this.metadata_object['cc_global'].forEach( (xx:any) => {

           $(`#container_tot_CC_input_${x['line_number']}`).append(`
             <div class="cc_row_parent_vincoli" id="div_select_CC-${this.counter}">
               <div class="selettore_cc_vincoli mb-2">
                 <select class="form-control form-control-sm cc_as_input" id = "select_cc_input-${this.counter}" disabled>
                 <option value="${xx['AS'][0]}" class="added disabled">
                    ${xx['AS'][0]} </option>
                 </select>
               </div>
               <div id ="container_CC_input-${this.counter}">
                 <div class="row cc_row_input-${this.counter}" id ="row-${this.counter}">
                   <div class="col-sm-2"></div>
                   <div class="col-sm-4">
                     <select class="form-control form-control-sm cc_value_input" placeholder="${xx['value'][0]}" disabled>
                      <option value="${xx['value'][0]}" selected>${xx['value'][0]}</option>
                     </select>
                   </div>
                   <div class="col-sm-4">
                     <input class="form-control form-control-sm cc_num_input" type="text" value="${xx['num']}" placeholder="${xx['num']}" disabled>
                   </div>
                   <div class="col-sm-2">
                     <button type="button" class ="del_button_${x['line_number']}" id ="del_button-${this.counter}"><i class="fas fa-times del_botton-${this.counter}"></i></button>
                   </div>
                 </div>
              </div>
            </div>`)


           if ($(`#container_tot_CC_input_${x['line_number']} .cc_row_parent_vincoli`).length <= 1) {
             $(`.del_button_${x['line_number']}`).addClass("hidden")
           }
           else {
               $(`.del_button_${x['line_number']}`).removeClass("hidden")
           }

           $(`#del_button-${this.counter}`).click(function(){
              $(`#div_select_CC${this.id.substring(this.id.indexOf("-"))}`).remove()

                if ($(`#container_tot_CC_input_${x['line_number']} .cc_row_parent_vincoli`).length <= 1) {
                  $(`.del_button_${x['line_number']}`).addClass("hidden")
                }
            })
           this.counter += 1

           })


           //se seleziono il bottone aggiungo i vincoli
           var button_add_cc:any = document.querySelector(`#add_cc_${x['line_number']}`);
           button_add_cc.addEventListener('click', (event:any) => {
             // this.counter += 1

             $(`#container_tot_CC_input_${x['line_number']}`).append(`
               <div class="cc_row_parent_vincoli" id="div_select_CC-${this.counter}">
                 <div class="selettore_cc_vincoli mb-2">
                   <select class="form-control form-control-sm cc_as_input" id = "select_cc_input-${this.counter}">
                     <option value="" disabled selected class="added disabled">Select SA for CC</option>
                     ${this.metadata_object['number_AS'].map((v:any)=> `<option value="${v['as']}" class="added">${v['as']}</option>`).join('')}
                     </option>
                   </select>
                 </div>
               </div>`)

               var fun = this.addCC2_multi
               var values_list:any = this.metadata_object['number_AS']
               $(`#select_cc_input-${this.counter}`).change(function(){
                   $(`#${this.id}`).prop('disabled', true)
                   fun($(`#${this.id}`).val(), values_list, x['line_number'], this.id.substring(this.id.indexOf("-")))
                })

              this.counter += 1

           })

       }




      })


       //CODICE
       Axios.get(`http://localhost:5000/get_script/${this.metadata_object['selected_script']}`).then((data:any) => {

           $("#pipeline_code_text").html(data.data['script'].split('\n').map((x:any, i:any) => {
             return `<div class= "${this.existing_filters.map((y:any) => y['line_number']).includes(i+1) ? 'selected_lines_script' : ''}"  id ="line_number_txt_${i+1}"><span class="monospace_number"">${i+1}</span><span class="monospace_text_script">${x}</span></div>`
             }).join('')
           )

       })



       // se clicco le linee si aggiorna vettore e si colora il testo
       var btn:any = document.querySelector('#rewriting_lines');

       btn.addEventListener('click', (event:any) => {
         var checkboxes:any = document.querySelectorAll(`input[name="bottone_linea"]:checked`);
         var selected_lines_tmp:any = []

         var checkboxes_notChecked:any = document.querySelectorAll(`input[name="bottone_linea"]`);
         var selected_lines_notChecked:any = []

//se bottone non e' checked
         checkboxes_notChecked.forEach( function(checkbox:any){
            selected_lines_notChecked.push(checkbox.value);
            $(`#line_number_txt_${checkbox.value}`).removeClass("selected_lines_checked")
            $(`#execution_type_${checkbox.value}`).addClass("hidden")
            $(`#cc_line_${checkbox.value}`).addClass("hidden")
            $(`#container_tot_CC_input_${checkbox.value}`).addClass("hidden")

          })

//se bottone checked
         checkboxes.forEach( function(checkbox:any){
            selected_lines_tmp.push(checkbox.value);
            $(`#line_number_txt_${checkbox.value}`).addClass("selected_lines_checked")
            $(`#execution_type_${checkbox.value}`).removeClass("hidden")
            $(`#cc_line_${checkbox.value}`).removeClass("hidden")
            $(`#container_tot_CC_input_${checkbox.value}`).removeClass("hidden")
          });


         this.selected_lines = selected_lines_tmp

         console.log('numero linee selezionate', this.selected_lines.length)

         if (this.selected_lines.length >= 1){
            $("#button_next_vincoli").prop('disabled', false)
         }
         else{
           $("#button_next_vincoli").prop('disabled', true)
         }

       });



    })

  }

}
