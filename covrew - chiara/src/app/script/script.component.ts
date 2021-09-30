import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import Axios from 'axios';

@Component({
  selector: 'app-script',
  templateUrl: './script.component.html',
  styleUrls: ['./script.component.css']
})
export class ScriptComponent implements OnInit {

  constructor(private router: Router) { }

  addNewItemRewriting() {

    Axios.post('http://localhost:5000/script', {'script': $("#script_text").val()}).then((data:any) => {
      this.metadata_object['selected_script'] = data['data']['script']

      var pippo  = history.state
      pippo['script'] = this.metadata_object
      this.router.navigate(['/vincoli'], {state: pippo});
    })
  }


  metadata_object:any = {}
  script_name:any = null


  ngOnInit(): void {
    this.metadata_object = history.state.dataset
    console.log('input script ')
    console.log(this.metadata_object)

    $("#button_next_script").prop('disabled', true)

    var script_name:string = ''

    this.metadata_object['scripts'].forEach( (x:any, i:any) => {
      $("#bottoni_").append(`
        <button type="button" class="bottoni_script" id="${x.substring(0,x.length-3)}"> Script ${i+1} </button>
      `)

      // tooltip esempi adult
      // if (this.metadata_object['scripts'][0].split("_")[0] == 'adult'){
            $(`#${x.substring(0,x.length-4)}1`).tooltip({title:"Two slicing operations with two selection conditions", placement:'left'})
            $(`#${x.substring(0,x.length-4)}2`).tooltip({title:"Four slicing operations with up to three filtering conditions", placement:'left'})
            $(`#${x.substring(0,x.length-4)}3`).tooltip({title:"Two slicing operations with up to four filtering conditions", placement:'left'})
      //     }
      // else {
      //       // tooltip esempi diabete
      //       $(`#${x.substring(0,x.length-4)}1`).tooltip({title:"One slicing operations with three selection conditions; SVC model training", placement:'left'})
      //       $(`#${x.substring(0,x.length-4)}2`).tooltip({title:"Two slicing operations with two and one selection conditions; Random Forest model training", placement:'left'})
      //       $(`#${x.substring(0,x.length-4)}3`).tooltip({title:"One slicing operation with two selection conditions; Random Forest model training", placement:'left'})
      // }

      $(`#${x.substring(0,x.length-3)}`).click(() => {
        Axios.get(`http://localhost:5000/get_script/${x}`).then((data:any) => {
          $("#script_text").val('')
          $("#script_text").val(data.data['script'])
          $("#button_next_script").prop('disabled', false)

          $('#script_text').click(function() {console.log(this)})

        })


        this.script_name = x
      });
      $('#container_chiara').click();

    })

  }

}
