import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import * as bootstrap from "bootstrap";
import Axios from 'axios';
import { Location } from '@angular/common';
// import {MatTooltipModule} from '@angular/material/tooltip';

import {FormControl} from '@angular/forms';
import {TooltipPosition} from '@angular/material/tooltip';


@Component({
  selector: 'app-statistiche',
  templateUrl: './statistiche.component.html',
  styleUrls: ['./statistiche.component.css']
})

export class StatisticheComponent implements OnInit {

  constructor(private router: Router, private location: Location) {}

  addNewItemRewriting() {
    this.metadata_object_final['filename'] =  this.metadata_object['filename']

    var pippo = history.state
    pippo['statistiche'] = this.metadata_object_final

    this.router.navigate(['/finale'], {state: pippo });
  }

  back(){
    this.location.back()
  }

  createHist(id:any, cmg_info:any, margin:any) {
    console.log(cmg_info)

    // set the dimensions and margins of the graph
    var width = 350 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(id)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    var svg_legend = d3.select(id)
      .append("svg")
        .attr("width", width/2)
        .attr("height", height + margin.top + margin.bottom);



     if ((cmg_info['op'] == '>') || (cmg_info['op'] == '>=')){
       // X axis: scale and draw:
       var x = d3.scaleLinear()
           .domain([cmg_info['new_val'], cmg_info['max']])
           .range([0, width]);
           console.log(x)

       var qualcosa = d3
          .axisBottom(x)
          .ticks(10)

       if (cmg_info['hist_bin_dopo'].length < 10){
          qualcosa = qualcosa.tickValues(d3.range(cmg_info['new_val'], cmg_info['max']+1))
       }

       qualcosa = qualcosa.tickFormat(d3.format(".2s"))

       svg.append("g")
           .attr("transform", "translate(0," + height + ")")
          .call(qualcosa);
          // .call(d3.axisBottom(x));
       }
     else {
         // X axis: scale and draw:
         var x = d3.scaleLinear()
             .domain([cmg_info['min'], cmg_info['new_val']])
             .range([0, width]);

         var qualcosa = d3
            .axisBottom(x)
            .ticks(10)

         if (cmg_info['hist_bin_dopo'].length < 10){
            qualcosa = qualcosa.tickValues(d3.range(cmg_info['min']-1, cmg_info['new_val']))
         }

         qualcosa = qualcosa.tickFormat(d3.format(".2s"))


         svg.append("g")
             .attr("transform", "translate(0," + height + ")")
             .call(qualcosa);
             // .call(d3.axisBottom(x).tickFormat(d3.format(".2s")));
       }

      var y_max = d3.max<[number, number], number>(cmg_info['hist_bin_dopo'], function(d:any) { return d[0]; })
      y_max = y_max ? y_max : 0

      // Y axis: scale and draw:
      var y = d3.scaleLinear()
          .range([height, 0]);
          y.domain([0, y_max]);
      svg.append("g")
          .call(d3.axisLeft(y));



    var width_bin = cmg_info['hist_bin_prima'][1][1] - cmg_info['hist_bin_prima'][0][1];


    //  append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(cmg_info['hist_bin_dopo'])
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", function(d:any) { return "translate(" + x(d[1]) + "," + y(d[0]) + ")"; })
          .attr("width", function(d:any) { return x(d[1]+width_bin) - x(d[1]) ; }) // vedere se togliere -1
          .attr("height", function(d:any) { return height - y(d[0]); })
          .style("fill", "#f77f00");

    svg.selectAll("rect2")
        .data(cmg_info['hist_bin_prima'])
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", function(d:any) { return "translate(" + x(d[1]) + "," + y(d[0]) + ")"; })
          .attr("width", function(d:any) { return x(d[1]+width_bin) - x(d[1]) ; }) // vedere se togliere -1
          .attr("height", function(d:any) { return height - y(d[0]); })
          .style("fill", "#ADD8E6");


      // text label for the x axis
      svg.append("text")
          .attr("transform",
                "translate(" + (width/2) + " ," +
                               (height + margin.top + 20) + ")")
          .style("text-anchor", "middle")
          .text(cmg_info['attr']);

      // text label for the y axis
      svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x",0 - (height / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Count");


  //  LEGEND
      // svg_legend.append("rect").attr("x",0).attr("y",0).attr("width",130).attr("height", 40).style("stroke", "gray").style("opacity",0.1).style("stroke-width", "2")
    //  svg_legend.append("span").style("width",150).style("height", 60).style("stroke", "gray").style("opacity",0.1).style("stroke-width", "2")
      svg_legend.append("rect").attr("x",2).attr("y", 2).attr("width",20).attr("height", 10).style("fill", "#f77f00")
      svg_legend.append("rect").attr("x",2).attr("y", 20).attr("width",20).attr("height", 10).style("fill", "#ADD8E6")
      svg_legend.append("text").attr("x",30).attr("y", 10).text("Added rows").attr("alignment-baseline","middle")//.style("font-size", "15px").
      svg_legend.append("text").attr("x",30).attr("y",30).text("Original rows").attr("alignment-baseline","middle")//.style("font-size", "15px").


  }

  //
  // num_for_text(valore:any){
  //   var new_val:string = d3.format(".3s")(valore)
  //
  //   new_val_last = (new_val[new_val.length-1])
  //
  // }

  createBarAttrs(id:any, cmg_info:any, margin:any) {
    console.log(id, cmg_info)

    var width_svg = 260 - margin.left - margin.right,
        height_svg = 200;

    var width = 200
    var height = 20
    var x_pos = 10
    var y_pos = 20

    var svg = d3.select(id)
      .append("svg")
      .attr("width", width_svg + 60)
      .attr("height", height_svg);

  // svg attrs
    svg.append("rect")
      .attr("x",x_pos)
      .attr("y",y_pos)
      .attr("width", width)
      .attr("height", height)
      .style('fill', 'white')
      //.style("opacity",0.5)
      .style("stroke", "#03254c")
      .style("stroke-width", "1");

    svg.append("text").attr("x",0).attr("y", y_pos+height+15).text(d3.format(".2s")(cmg_info['min'])).attr("alignment-baseline","middle");//.style("font-size", "15px").
    svg.append("text").attr("x",x_pos+width-10).attr("y", y_pos+height+15).text(d3.format(".2s")(cmg_info['max'])).attr("alignment-baseline","middle");

    if ((cmg_info['op'] == '>') || (cmg_info['op'] == '>=')){
      console.log('if maggiore', cmg_info['new_val'], d3.format(".2s")(cmg_info['new_val']), d3.format(".2s")(cmg_info['new_val']),d3.format(".0s")(cmg_info['new_val']), d3.format(".3s")(cmg_info['new_val']))
console.log(cmg_info['val'],x_pos+(cmg_info['val']*width/cmg_info['max']) )
console.log(cmg_info['new_val'],x_pos+(cmg_info['new_val']*width/cmg_info['max']) )
console.log(cmg_info['min'], cmg_info['max'] )
      //original rows
      svg.append("rect")
        .attr("x",x_pos+(cmg_info['val']*width/cmg_info['max']))
        .attr("y", y_pos)
        .attr("width", x_pos+width - (x_pos+(cmg_info['val']*width/cmg_info['max'])))
        .attr("height", height)
        .style("fill", "#ADD8E6")
        .style("stroke", "#03254c")
        .style("stroke-width", "1");

      svg.append("text")
        .attr("x",5+(cmg_info['val']*width/cmg_info['max']))
        // .attr("y", y_pos+height+15)
        .attr("y", y_pos-10 )
        .text(d3.format(".2s")(cmg_info['val']))
        .attr("alignment-baseline","middle");//.style("font-size", "15px").


        // var added_portion = (cmg_info['new_val']*width/cmg_info['max']) - (cmg_info['val']*width/cmg_info['max'])
        // if ( ((cmg_info['new_val']*width/cmg_info['max']) - (cmg_info['val']*width/cmg_info['max'])) < 1){
        //   added_portion = 1
        // }

      //added rows
      svg.append("rect")
        .attr("x",x_pos+(cmg_info['new_val']*width/cmg_info['max']))
        .attr("y", y_pos)
        .attr("width", (x_pos+(cmg_info['val']*width/cmg_info['max'])) - (x_pos+(cmg_info['new_val']*width/cmg_info['max'])) )
        .attr("height", height)
        .style("fill", "#ff8000")
        .style("stroke", "#03254c")
        .style("stroke-width", "1");

      // svg.append("text")
      //   .attr("x",x_pos+(cmg_info['new_val']*width/cmg_info['max'])-10)
      //   .attr("y", y_pos-10 )
      //   .text(d3.format(".2s")(cmg_info['new_val']))
      //   .style("fill", '#990000')
      //   .attr("alignment-baseline","middle");
      }
    else {
      console.log('if minore', cmg_info['new_val'])
      console.log(cmg_info['val'],x_pos+(cmg_info['val']*width/cmg_info['max']) )
      console.log(cmg_info['new_val'],x_pos+(cmg_info['new_val']*width/cmg_info['max']) )
      console.log(cmg_info['min'], cmg_info['max'] )
      //original rows
      svg.append("rect")
        .attr("x",x_pos)
        .attr("y", y_pos)
        .attr("width", x_pos+(cmg_info['val']*width/cmg_info['max']) )
        .attr("height", height)
        .style("fill", "#ADD8E6")
        .style("stroke", "#03254c")
        .style("stroke-width", "1");

      svg.append("text")
        .attr("x",5+(cmg_info['val']*width/cmg_info['max']))
        // .attr("y", y_pos+height+15)
        .attr("y", y_pos-10 )
        .text(d3.format(".2s")(cmg_info['val']))
        .attr("alignment-baseline","middle");//.style("font-size", "15px").


      // var added_portion = (cmg_info['new_val']*width/cmg_info['max']) - (cmg_info['val']*width/cmg_info['max'])
      // if ( ((cmg_info['new_val']*width/cmg_info['max']) - (cmg_info['val']*width/cmg_info['max'])) < 1.5){
      //   added_portion = 1.5
      // }

      //added rows
      svg.append("rect")
        .attr("x",x_pos+x_pos+(cmg_info['val']*width/cmg_info['max']))
        .attr("y", y_pos)
        .attr("width", (cmg_info['new_val']*width/cmg_info['max']) - (cmg_info['val']*width/cmg_info['max']) )
        .attr("height", height)
        .style("fill", "#ff8000")
        .style("stroke", "#03254c")
        .style("stroke-width", "1");

      // svg.append("text")
      //   .attr("x",x_pos+(cmg_info['new_val']*width/cmg_info['max'])-10)
      //   .attr("y", y_pos-10 )
      //   .style("fill", '#990000')
      //   .text(d3.format(".2s")(cmg_info['new_val']))
      //   .attr("alignment-baseline","middle");
      }
  }


  createBarMeasuresDiag(id:any, diag_min:any, diag_max:any, diag_sol:any) {

    var width:any = 200
    var height:any = 10
    var x_pos:any = 10
    var y_pos:any = 20

    var svg:any = d3.select(id)
      .append("svg")
        .attr("width", 300)
        .attr("height", 75);

  // svg attrs
    svg.append("rect")
      .attr("x",x_pos)
      .attr("y",y_pos)
      .attr("width", width)
      .attr("height", height)
      .style("stroke", "#963f11")
      .style('fill', 'white')
    //  .style("opacity",0.5)
      .style("stroke-width", "1");

    svg.append("text").attr("x",x_pos-5).attr("y", y_pos+height+15).text("0").attr("alignment-baseline","middle");//.style("font-size", "15px").
    svg.append("text").attr("x",x_pos+width).attr("y", y_pos+height+15).text("1").attr("alignment-baseline","middle");


    svg.append("rect")
      .attr("x",x_pos+(diag_min*width))
      .attr("y", y_pos)
      .attr("width", (diag_max*width) - (diag_min*width))
      .attr("height", height)
      .style("fill", "#ffe6cc")
      .style("stroke", "#963f11")
      .style("stroke-width", "0.8");

    svg.append("text")
      .attr("x",x_pos+(diag_min*width))
      .attr("y", y_pos-10 )
      .text(diag_min.toFixed(2))
      .attr("alignment-baseline","middle");//.style("font-size", "15px").
    svg.append("text")
      .attr("x",x_pos+(diag_max*width))
      .attr("y", y_pos -10 )
      .text(diag_max.toFixed(2))
      .attr("alignment-baseline","middle");

    svg.append("line")
      .attr("x1", x_pos+(diag_sol*width))
      .attr("y1", y_pos)
      .attr("x2", x_pos+(diag_sol*width))
      .attr("y2", y_pos + height)
      .style("stroke-width", 2)
      .style("stroke", "#990000")
      .style("fill", "none");
    svg.append("text")
      .attr("x",x_pos+(diag_sol*width))
      .attr("y", y_pos+height+15)
      .text(diag_sol.toFixed(2))
      .style("fill", '#990000')
      .attr("alignment-baseline","middle");
  }


  createBarMeasuresProximity(id:any, proximity:any) {

    var width:any = 200
    var height:any = 10
    var x_pos:any = 10
    var y_pos:any = 20

    var svg:any = d3.select(id)
      .append("svg")
        .attr("width", 300)
        .attr("height", 75);

  // svg attrs
    svg.append("rect")
      .attr("x",x_pos)
      .attr("y",y_pos)
      .attr("width", width)
      .attr("height", height)
      .style("stroke", "#963f11")
      .style('fill', 'white')
      // .style("opacity",0.5)
      .style("stroke-width", "1");

    svg.append("text").attr("x",x_pos-5).attr("y", y_pos+height+15).text("0").attr("alignment-baseline","middle");//.style("font-size", "15px").
    svg.append("text").attr("x",x_pos+width).attr("y", y_pos+height+15).text("1").attr("alignment-baseline","middle");


    svg.append("line")
      .attr("x1", x_pos+(proximity*width))
      .attr("y1", y_pos)
      .attr("x2", x_pos+(proximity*width))
      .attr("y2", y_pos + height)
      .style("stroke-width", 2)
      .style("stroke", "#990000")
      .style("fill", "none");
    svg.append("text")
      .attr("x",x_pos+(proximity*width))
      .attr("y", y_pos+height+15)
      .text(proximity.toFixed(2))
      .style("fill", '#990000')
      .attr("alignment-baseline","middle");
  }


  infoCardinality(id:any, metadata:any, margin:any){
    console.log('entra qui 1', id, metadata)

    $(id).append(`<table class="table table_card_3info">
      <tbody>
        <tr>
          <td><b># Original</b></td>
          <td>${metadata['card_tot_init']}</td>
        </tr>
        <tr>
          <td><b># New</b></td>
          <td>${metadata['card_tot_final']}</td>
        </tr>
        <tr>
          <td><b>% Increase</b></td>
          <td>${(100*metadata['relaxation_degree']).toFixed(2)}%</td>
        </tr>
        <tr>
         <td> </td>
         <td> </td>
        </tr>
      </tbody>
      </table>`)

    }


  infoCardinalityTable(id:any, metadata:any, margin:any){

    console.log('entra qui 2', metadata['CC'][0]['AS'],  metadata['CC'][0]['AS'][0])


    var columns = ["Sensitive attribute", "Value", "# Original", "% Original", "# CC", "# New", "% New"];

    $(id).append(`<div class="wrapper"><table class="table table-bordered table-hover table_card" id="table_card_id"><thead><tr id="${id.substring(1)}_table_h"></tr></thead></table></div>`)

    for (var i = 0; i < columns.length; i++) {
      $(`${id}_table_h`).append(`<th>${columns[i]}</th>`)
    }

    $(`${id} table`).append(`<tbody></tbody>`)

    for (var j = 0; j < metadata['CC'].length; j++) {

      if (metadata['CC'][j]['AS'].length <= 1){
      var row = [metadata['CC'][j]["AS"][0], metadata['CC'][j]["value"][0], metadata['card_as_init'][j], (100*(metadata['card_as_init'][j]/metadata['card_tot_init'])).toFixed(2), metadata['CC'][j]["num"], metadata['card_as_final'][j], (100*(metadata['card_as_final'][j]/metadata['card_tot_final'])).toFixed(2)];
      }
      else{
        //
        // console.log(metadata['CC'][j]['AS'])
        // var as:string[] = ""//metadata['CC'][j]['AS']
        // metadata['CC'][j]['AS'].forEach((element:any) => { as=as.concat(element))
        // });
        // console.log(as)

        var row = [metadata['CC'][j]["AS"][0] + "+" + metadata['CC'][j]["AS"][1], metadata['CC'][j]["value"][0] + "," +  metadata['CC'][j]["value"][1], metadata['card_as_init'][j], (100*(metadata['card_as_init'][j]/metadata['card_tot_init'])).toFixed(2), metadata['CC'][j]["num"], metadata['card_as_final'][j], (100*(metadata['card_as_final'][j]/metadata['card_tot_final'])).toFixed(2)];

      }


      $(`${id} tbody`).append(`<tr></tr>`)

      for (var i = 0; i < row.length; i++) {
        $(`${id} tr`).last().append(`<td>${row[i]}</td>`)
      }

      // vincolo soddisfatto o meno
      $(`${id} tr`).last().append(`<td class= "border_cell">${(metadata['card_as_final'][j] >= metadata['CC'][j]["num"]) ? `<i class="fas fa-check-square tooltip-satisfied"></i>` : `<i class="fas fa-exclamation-triangle tooltip-not-satisfied"></i>`}</td>`)
    }


    $(".tooltip-satisfied").tooltip({title:"Constraint satisfied", placement:'left'})
    $(".tooltip-not-satisfied").tooltip({title:"Constraint is not satisfied", placement:'left'})
  }


  metadata_object_final:any = {}
  metadata_object:any = {}
  // metadata_bins:any = [] //era sotto in void()

  ngOnInit(): void {

      this.metadata_object = history.state.vincoli

      console.log('input statistiche ')
      console.log(this.metadata_object)

      var metadata:any = []


        Axios.post('http://localhost:5000/rewrite_query', this.metadata_object).then((data:any) => {
          this.metadata_object_final['filters'] = data.data.filters
          metadata = data.data.filters

          console.log(metadata)
          console.log(this.metadata_object.filters)

            var margin:any = {top: 15, right: 15, bottom: 40, left: 60};

            // var ul = document.createElement('ul');
            for (var j:any = 0; j < metadata.length; j++) {
              console.log(j, metadata[j]["line_number"])

              $("ul.nav-pills").first().append(`<li><a data-toggle="tab" href="#linea${metadata[j]["line_number"]}">Line ${metadata[j]["line_number"]}</a></li>`);


            console.log(metadata[j]['cmg_info'])

            if (metadata[j]['cmg_info'] == "The coverage constraint is already satisfied" || metadata[j]['cmg_info'] == "It is not possible to rewrite the query" || metadata[j]['cmg_info'] == "Query rewriting is not possible: at least one of the sensitive attributes does not appear in the projection list") {
              $("div.tab-content").first().append(`
                <div id="linea${metadata[j]["line_number"]}" class="tab-pane fade in"  style="height:520px; overflow-y:auto;" >
                  <h4 style="color:#cc0000"> ${metadata[j]['cmg_info']} </h4>
                </div>`)

            }
            else {
              $("div.tab-content").first().append(`
                <div id="linea${metadata[j]["line_number"]}" class="tab-pane fade in"  style="height:620px; overflow-y:auto;" >
                  <h4 style="color:#cc0000"> Rewritten selection conditions </h4>
                </div>`)

              for (var i:any = 0; i < metadata[j]['cmg_info']['cmg_info'].length; i++) {


                  $(`#linea${metadata[j]["line_number"]}`).first().append(`
                  <div class="row">
                    <div class="col-sm-3">
                      <div id="new_cond_attr_${metadata[j]["line_number"]}_${i}">
                        <div class="box_text_stat" style="margin-top:15px">
                        ${metadata[j]['cmg_info']['cmg_info'][i]['attr']} ${metadata[j]['cmg_info']['cmg_info'][i]['op']} ${metadata[j]['cmg_info']['cmg_info'][i]['new_val']}
                        </div>
                      </div>
                    </div>

                    <div class="col-sm-3">
                       <div id="bar_attr_${metadata[j]["line_number"]}_${i}"></div>
                    </div>

                    <div class="col-sm-6">
                        <div id="histogram_plot_${metadata[j]["line_number"]}_${i}"></div>
                    </div>
                  </div>`)

                  this.createBarAttrs(`#bar_attr_${metadata[j]["line_number"]}_${i}`, metadata[j]['cmg_info']['cmg_info'][i], margin);
                  this.createHist(`#histogram_plot_${metadata[j]["line_number"]}_${i}`, metadata[j]['cmg_info']['cmg_info'][i], margin);

                  $(`#linea${metadata[j]["line_number"]}`).first().append(`<hr>`)

                }


              $(`#linea${metadata[j]["line_number"]}`).first().append(`
                <div class="row">
                  <div class="col-sm-3">
                    <h4 style="color:#cc0000"> Approximation error </h4>
                    <div id="bar_diag_${metadata[j]["line_number"]}"></div>
                  </div>
                  <div class="col-sm-3">
                    <h4 style="color:#cc0000"> Proximity </h4>
                    <div id="bar_proximity_${metadata[j]["line_number"]}"></div>
                  </div>
                </div>`)

              this.createBarMeasuresDiag(`#bar_diag_${metadata[j]["line_number"]}`, Number(metadata[j]["cmg_info"]['diag_min']), Number(metadata[j]["cmg_info"]['diag_max']), Number(metadata[j]["cmg_info"]['diag_sol']));
              this.createBarMeasuresProximity(`#bar_proximity_${metadata[j]["line_number"]}`, Number(metadata[j]["cmg_info"]['proximity']));

              $(`#linea${metadata[j]["line_number"]}`).first().append(`<hr>`)

              $(`#linea${metadata[j]["line_number"]}`).first().append(`
                <div>
                  <h4 style="color:#cc0000"> Cardinality </h4>
                  <div class="box_card_stat">
                    <div class="row">
                      <div class="col-sm-3" id = "info_cardinality_text_${metadata[j]["line_number"]}"></div>
                      <div class="col-sm-9" id = "info_cardinality_table_${metadata[j]["line_number"]}"></div>
                    </div>
                  </div>
                 </div> `)

                 console.log('arriva qui')

               this.infoCardinality(`#info_cardinality_text_${metadata[j]["line_number"]}`,  metadata[j]["cmg_info"], margin)
               this.infoCardinalityTable(`#info_cardinality_table_${metadata[j]["line_number"]}`,  metadata[j]["cmg_info"], margin)

             }


               $("ul.nav-pills li").first().addClass('active')
               $(`#linea${metadata[0]["line_number"]}`).addClass('active')
             }//


        })

  }

}
