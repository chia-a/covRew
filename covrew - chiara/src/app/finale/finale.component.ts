import { Component, OnInit } from '@angular/core';
import Axios from 'axios';

@Component({
  selector: 'app-finale',
  templateUrl: './finale.component.html',
  styleUrls: ['./finale.component.css']
})
export class FinaleComponent implements OnInit {

  constructor() { }

  metadata_object:any = {}

  ngOnInit(): void {

    this.metadata_object = history.state.statistiche
    console.log(this.metadata_object)


     Axios.get(`http://localhost:5000/get_script/${this.metadata_object['filename']}`).then((data:any) => {
       console.log(data)
       console.log(this.metadata_object['filters'])
         $("#final_script_text").html(data.data['script'].split('\n').map((x:any, i:any) => {
           return `<div class= "${this.metadata_object['filters'].map((y:any) => y['line_number']).includes(i+1) ? 'selected_lines_final' : ''}" id ="line_number_txt_${i+1}"><span class="monospace_number"">${i+1}</span><span class="monospace_text">${x}</span></div>`
           }).join('')
         )

         this.metadata_object['filters'].forEach((element:any) => {
           if (element.new_line){
             $(`#line_number_txt_${element.line_number} span.monospace_text`).remove()
             $(`#line_number_txt_${element.line_number}`).append(
               `<span class="monospace_text selected_rewritten_lines_final">${element.new_line}</span>`
             )


           }

         });

        // this.metadata_object['filters'].map((y:any) => console.log(y['line_number'])) //.includes(i+1)
        // this.metadata_object['filters'].map((y:any) => console.log(y['new_line']))
     })


  }

}
