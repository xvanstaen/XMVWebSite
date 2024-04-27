
import {
    Chart, ChartOptions, ChartType, ChartConfiguration, PluginChartOptions, ScaleChartOptions, ChartDataset,
    BarController, BarElement, CategoryScale, ChartData, LinearScale, LineController, LineElement, PointElement,
  } from 'chart.js/auto';


export function buildBarChartDataSet(dataSet:any, nbLabels:number, iLabel:any, paramChart:any, configChart:any, constLab:any, colorLab:any){
    

        dataSet.push({
            label: "",
            backgroundColor: [], // The line fill color.
            borderColor: [],
            borderWidth: [],
            data: [],
            order: 1,
            datalabels: {
            align: 'center',
            anchor: 'center',
            },
            barThickness: '',
        });
        const i = dataSet.length - 1;
        if (paramChart.barThickness !== 0) {
            dataSet[i].barThickness = paramChart.barThickness;
          } else {
            dataSet[i].barThickness = configChart.barThickness;
          }
          dataSet[i] = commonModule(dataSet[i], configChart, iLabel, constLab[i], colorLab[i]);
          return dataSet;
}

export function buildLineChartDataSet(dataSet:any, nbLabels:number, iLabel:any, paramChart:any, configChart:any, constLab:any, colorLab:any){
    var iSpecBorder: number = 0;

    dataSet.push({
            label: "",
            backgroundColor: '',
            borderColor: [], //The line color.
            borderWidth: 3, //The line width (in pixels).
            data: [],
            order: 1,
            
            showLine: true,
            fill: false, //true 
            pointRadius: 2,
            pointBorderColor: '',
            pointBackgroundColor: '',
            pointBorderWidth: 0,//2, 
            tension: 0.2,
            pointStyle: "line",
            hoverBackgroundColor: "",
            pointHoverBackgroundColor: ''
    });
    const i = dataSet.length - 1;
    // BORDER COLOR
    if (i < configChart.lineChart.datasets.length && configChart.lineChart.datasets[i].borderColor !== undefined) {
        iSpecBorder = 0;
        for (var iBorder = 0; iBorder < configChart.lineChart.datasets[i].borderColor.length; iBorder++) {
          if (paramChart.labelsColor.length > 0 && paramChart.labels[iBorder] === 'Y') {
            dataSet[i].borderColor[iSpecBorder] = configChart.lineChart.datasets[i].borderColor[iBorder];
            iSpecBorder++
          }
        }
      } else if (configChart.lineChart.datasetsDefault.borderColor !== undefined) {
        iSpecBorder = 0;
        for (var iBorder = 0; iBorder < configChart.lineChart.datasetsDefault.borderColor.length; iBorder++) {
          if (paramChart.labelsColor.length > 0 && paramChart.labels[iBorder] === 'Y') {
            dataSet[i].borderColor[iSpecBorder] = configChart.lineChart.datasetsDefault.borderColor[iBorder];
            iSpecBorder++
          }
        }
      } else if (configChart.barDefault.datasets.borderColor.length > 0) {
        iSpecBorder = 0;
        for (var iBorder = 0; iBorder < configChart.barDefault.datasets.borderColor.length; iBorder++) {
          if (paramChart.labelsColor.length > 0 && paramChart.labels[iBorder] === 'Y') {
            dataSet[i].borderColor[iSpecBorder] = configChart.barDefault.datasets.borderColor[iBorder];
            iSpecBorder++
          }
        }
      }
    // borderColor
    if (paramChart.labelsColor.length > 0) {
          iSpecBorder = 0;
          for (var iBorder = 0; iBorder < paramChart.labelsColor.length; iBorder++) {

            if (paramChart.labelsColor[iBorder] !== '' && paramChart.labels[iBorder] === 'Y') {
              dataSet[i].borderColor[iSpecBorder] = paramChart.labelsColor[iBorder];
              iSpecBorder++
            }
          }
    }

    if (i < configChart.lineChart.datasets.length) {
        if (configChart.lineChart.datasets[i].borderWidth !== undefined) {
          dataSet[i].borderWidth = configChart.lineChart.datasets[i].borderWidth;
        } else {
          dataSet[i].borderWidth = configChart.lineChart.datasetsDefault.borderWidth;
        }
        if (configChart.lineChart.datasets[i].pointRadius !== undefined) {
          dataSet[i].pointRadius = configChart.lineChart.datasets[i].pointRadius;
        } else {
          dataSet[i].pointRadius = configChart.lineChart.datasetsDefault.pointRadius;
        }
        if (configChart.lineChart.datasets[i].pointBorderColor !== undefined) {
          dataSet[i].pointBorderColor = configChart.lineChart.datasets[i].pointBorderColor;
        } else {
          dataSet[i].pointBorderColor = configChart.lineChart.datasetsDefault.pointBorderColor;
        }

        if (dataSet[i].borderColor[i] !== undefined) {
          dataSet[i].pointBackgroundColor = dataSet[i].borderColor[i];
        } else {
          dataSet[i].pointBackgroundColor = dataSet[i].borderColor[i];
        }


        if (configChart.lineChart.datasets[i].pointBorderWidth !== undefined) {
          dataSet[i].pointBorderWidth = configChart.lineChart.datasets[i].pointBorderWidth;
        } else {
          dataSet[i].pointBorderWidth = configChart.lineChart.datasetsDefault.pointBorderWidth;
        }

        if (configChart.lineChart.datasets[i].tension !== undefined) {
          dataSet[i].tension = configChart.lineChart.datasets[i].tension;
        } else {
          dataSet[i].tension = configChart.lineChart.datasetsDefault.tension;
        }

        if (configChart.lineChart.datasets[i].pointStyle !== undefined) {
          dataSet[i].pointStyle = configChart.lineChart.datasets[i].pointStyle;
        } else {
          dataSet[i].pointStyle = configChart.lineChart.datasetsDefault.pointStyle;
        }
        
        if (configChart.lineChart.datasets[i].fill !== undefined) {
          dataSet[i].fill = configChart.lineChart.datasets[i].fill;
        } else {
          dataSet[i].fill = configChart.lineChart.datasetsDefault.fill;
        }

      } else {
        dataSet[i].borderWidth = configChart.lineChart.datasetsDefault.borderWidth;
        dataSet[i].pointRadius = configChart.lineChart.datasetsDefault.pointRadius;
        dataSet[i].pointBorderColor = configChart.lineChart.datasetsDefault.pointBorderColor;
        dataSet[i].pointBackgroundColor = dataSet[i].borderColor[i]; 
        dataSet[i].tension = configChart.lineChart.datasetsDefault.tension;
        dataSet[i].pointStyle = configChart.lineChart.datasetsDefault.pointStyle;
        dataSet[i].fill = configChart.lineChart.datasetsDefault.fill;

      }
      dataSet[i].order = i;
      dataSet[i] = commonModule(dataSet[i], configChart, iLabel, constLab[i], colorLab[i]);
      return dataSet;
}

export function commonModule(dataSet:any, configChart:any, iLabel:number, constLab:any, colorLab:any){
    if (iLabel !== 0) {
        dataSet.label = constLab;
      } else {
        dataSet.label = configChart.barDefault.datasets.labels;
      }
      if (iLabel !== 0 && colorLab !== '') {
        dataSet.backgroundColor = colorLab;

      }
      else if (configChart.barChart.datasets.backgroundColor === undefined) {
        dataSet.backgroundColor = configChart.barDefault.datasets.backgroundColor;

      } else {
        dataSet.backgroundColor = configChart.barChart.datasets.backgroundColor;
      }
    return dataSet;
}

export function specialDraw(ctx:any, paramChart:any, configChart:any, dateLabel: Array<any>, theDatasets: Array<any>) {

    Chart.defaults.font.size = 14;
    var chartResult:any;

    var yStacked = false;
    var xStacked = false;

    if (paramChart.axisY.stacked === true) {
      yStacked = true;
    }
    if (paramChart.axisX.stacked === true) {
      xStacked = true;
    }


    var charTitle = '';
    if (paramChart.chartTitle.text !== '') {
      charTitle = paramChart.chartTitle.text;
    } else { charTitle = configChart.barChart.options.plugins.title.text };

    var TitleColor = '';
    if (paramChart.chartTitle.color !== '') {
      TitleColor = paramChart.chartTitle.color;
    } else { TitleColor = configChart.barChart.options.plugins.title.color };

    var mylegendTitle = '';
    if (paramChart.legendTitle.text !== '') {
      mylegendTitle = paramChart.legendTitle.text;
    } else { mylegendTitle = configChart.barChart.options.plugins.legend.title.text };

    var legendColor = '';
    if (paramChart.legendTitle.color !== '') {
      legendColor = paramChart.legendTitle.color;
    } else { legendColor = 'blue' };

    var theRatio = 0;
    if (paramChart.ratio !== 0) {
      theRatio = Number(paramChart.ratio);
    } else {
      theRatio = Number(configChart.barChart.options.aspectRatio);
    }

    var theboxWidth = 0;
    if (paramChart.legendBox.boxWidth !== 0) {
      theboxWidth = Number(paramChart.legendBox.boxWidth);
    } else if (configChart.barChart.options.plugins.legend.labels.boxWidth !== undefined) {
      theboxWidth = Number(configChart.barChart.options.plugins.legend.labels.boxWidth);
    } else if (configChart.barDefault.options.plugins.legend.labels.boxWidth !== undefined) {
      theboxWidth = Number(configChart.barDefault.options.plugins.legend.labels.boxWidth);
    }


    var theboxHeight = 0;
    if (paramChart.legendBox.boxHeight !== 0) {
      theboxHeight = Number(paramChart.legendBox.boxHeight);
    } else if (configChart.barChart.options.plugins.legend.labels.boxHeight !== undefined) {
      theboxHeight = Number(configChart.barChart.options.plugins.legend.labels.boxHeight);
    } else if (configChart.barDefault.options.plugins.legend.labels.boxHeight !== undefined) {
      theboxHeight = Number(configChart.barDefault.options.plugins.legend.labels.boxHeight);
    }

    var theboxradius = 0;
    if (paramChart.legendBox.borderRadius !== 0) {
      theboxradius = Number(paramChart.legendBox.borderRadius);
    } else if (configChart.barChart.options.plugins.legend.labels.borderRadius !== undefined) {
      theboxradius = Number(configChart.barChart.options.plugins.legend.labels.borderRadius);
    } else if (configChart.barDefault.options.plugins.legend.labels.borderRadius !== undefined) {
      theboxradius = Number(configChart.barDefault.options.plugins.legend.labels.borderRadius);
    }

    var theboxfontSize = 0

    if (paramChart.legendBox.font.size !== 0) {
      theboxfontSize = Number(paramChart.legendBox.font.size);
    } else if (configChart.barChart.options.plugins.legend.labels.font.size !== undefined) {
      theboxfontSize = Number(configChart.barChart.options.plugins.legend.labels.font.size);
    } else if (configChart.barDefault.options.plugins.legend.labels.font.size !== undefined) {
      theboxfontSize = Number(configChart.barDefault.options.plugins.legend.labels.font.size);
    }


    var thepointStyle = '';
    if (paramChart.legendBox.pointStyle !== '') {
      thepointStyle = paramChart.legendBox.pointStyle;
    } else if (configChart.barChart.options.plugins.legend.labels.pointStyle !== undefined) {
      thepointStyle = configChart.barChart.options.plugins.legend.labels.pointStyle;
    } else if (configChart.barDefault.options.plugins.legend.labels.pointStyle !== undefined) {
      thepointStyle = configChart.barDefault.options.plugins.legend.labels.pointStyle;
    }

    var theColorBox = '';
    if (paramChart.legendBox.color !== '') {
      theColorBox = paramChart.legendBox.color;
    } else if (configChart.barChart.options.plugins.legend.labels.color !== undefined) {
      theColorBox = configChart.barChart.options.plugins.legend.labels.color;
    } else if (configChart.barDefault.options.plugins.legend.labels.color !== undefined) {
      theColorBox = configChart.barDefault.options.plugins.legend.labels.color;
    }

    if (configChart.barDefault.options.indexAxis === 'x') {
      Chart.defaults.indexAxis = 'x';
    } else {
      Chart.defaults.indexAxis = 'y'
    }

    if (paramChart.chartTitle.position === 'bottom') {
      Chart.defaults.plugins.title.position = 'bottom';
    } else if (paramChart.chartTitle.position === 'top') {
      Chart.defaults.plugins.title.position = 'top'
    }

    if (paramChart.legendTitle.position === 'bottom') {
      Chart.defaults.plugins.legend.position = 'bottom';
    } else if (paramChart.legendTitle.position === 'top') {
      Chart.defaults.plugins.legend.position = 'top'
    }

    Chart.defaults.plugins.title.align = 'center';
    if (paramChart.chartTitle.align === 'end') {
      Chart.defaults.plugins.title.align = 'end';
    } else if (paramChart.chartTitle.align === 'start') {
      Chart.defaults.plugins.title.align = 'start'
    }
    Chart.defaults.plugins.legend.align = 'center';
    if (paramChart.legendTitle.align === 'start') {
      Chart.defaults.plugins.legend.align = 'end';
    } else if (paramChart.legendTitle.align === 'start') {
      Chart.defaults.plugins.legend.align = 'start';
    }
    if (paramChart.axisY.position === 'left') {
      Chart.defaults.scales.category.position = 'left';
    } else {
      Chart.defaults.scales.category.position = 'right';
    }
    var displayChartTitle = false;
    var displayLegendTitle = false;
    if (paramChart.chartTitle.display === true) {
      displayChartTitle = true;
    }
    if (paramChart.legendTitle.display === true) {
      displayLegendTitle = true;
    }

    if (paramChart.chartType === 'bar') {
        chartResult = new Chart(
        ctx, {
        type: 'bar',

        data: {
          labels: dateLabel,
          datasets: theDatasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: configChart.barDefault.options.layout.padding.left,
              top: configChart.barDefault.options.layout.padding.top
            }
          },
          plugins: {
            title: {
              padding: {
                top: paramChart.chartTitle.padding.top,
                bottom: paramChart.chartTitle.padding.bottom,
              },
              //position: "bottom",
              display: true,
              text: charTitle,
              //align:'center',
              color: TitleColor,
              font: {
                size: paramChart.chartTitle.font.size,
                weight: paramChart.chartTitle.font.weight,
                family: paramChart.chartTitle.font.family,
              }
            },
            legend: {
              //align:'center',
              //position: 'top',   // label position left/right/top/bottom
              labels: {
                boxWidth: theboxWidth,
                boxHeight: theboxHeight,
                color: theColorBox,
                usePointStyle: true,
                pointStyle: thepointStyle,
                borderRadius: theboxradius,

                font: {
                  size: theboxfontSize,
                  weight: paramChart.legendBox.font.weight,
                  family: paramChart.legendBox.font.family,
                }

              },
              maxHeight: configChart.barDefault.options.plugins.legend.maxHeight,
              maxWidth: configChart.barDefault.options.plugins.legend.maxWidth,
              reverse: false,
              title: {
                display: displayLegendTitle,
                text: mylegendTitle,
                color: legendColor,
                padding: {
                  left: paramChart.legendTitle.padding.left,
                  top: paramChart.legendTitle.padding.top,
                  bottom: paramChart.legendTitle.padding.bottom,
                },
                font: {
                  size: paramChart.legendTitle.font.size,
                  weight: paramChart.legendTitle.font.weight,
                  family: paramChart.legendTitle.font.family,
                }
              },

            },
          },
          elements: {
            point: {
              radius: 0,
              borderWidth: 0,
            }
          },
          //indexAxis: 'x',
          scales: {
            y: {
              beginAtZero: true,
              type: 'linear',
              position: 'right',
              stacked: yStacked,
              border: {
                color: paramChart.axisY.border.color,
                width: paramChart.axisY.border.width
              },
              ticks: {
                // stepSize:0.7,
                color: paramChart.axisY.ticks.color,
              }
            },
            x: {
              stacked: xStacked,
              border: {
                color: paramChart.axisX.border.color,
                width: paramChart.axisX.border.width
              },
              ticks: {
                color: paramChart.axisX.ticks.color,
              }
            },
          },
          aspectRatio: theRatio,
        },
      });
    }
    else if (paramChart.chartType === 'line') {
        chartResult = new Chart(
        ctx, { 
        type: 'line',

        data: {
          labels: dateLabel,
          datasets: theDatasets,
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            line: { borderWidth: 7 }
          },
          layout: {
            padding: {
              left: configChart.barDefault.options.layout.padding.left,
              top: configChart.barDefault.options.layout.padding.top
            }
          },
          plugins: {
            subtitle: {
              display: false,
              text: 'Custom Chart Subtitle'
            },
            title: {
              padding: {
                top: paramChart.chartTitle.padding.top,
                bottom: paramChart.chartTitle.padding.bottom,
              },
              //position: 'bottom',
              fullSize: false,
              display: displayChartTitle,
              text: charTitle,
              //align:'center',
              color: TitleColor,
              font: {
                size: paramChart.chartTitle.font.size,
                weight: paramChart.chartTitle.font.weight,
                family: paramChart.chartTitle.font.family,
              }
            },
            legend: {
              //align:'center',
              //position: 'top',   // label position left/right/top/bottom
              labels: {
                boxWidth: theboxWidth,
                boxHeight: theboxHeight,
                usePointStyle: true,
                pointStyle: thepointStyle,
                borderRadius: theboxradius,
                color: theColorBox,
                font: {
                  size: theboxfontSize,
                  weight: paramChart.legendBox.font.weight,
                  family: paramChart.legendBox.font.family,
                }

              },
              maxHeight: configChart.barDefault.options.plugins.legend.maxHeight,
              maxWidth: configChart.barDefault.options.plugins.legend.maxWidth,
              reverse: false,
              title: {
                display: displayLegendTitle,
                text: mylegendTitle,
                color: legendColor,
                padding: {
                  left: paramChart.legendTitle.padding.left,
                  top: paramChart.legendTitle.padding.top,
                  bottom: paramChart.legendTitle.padding.bottom,
                },
                font: {
                  size: paramChart.legendTitle.font.size,
                  weight: paramChart.legendTitle.font.weight,
                  family: paramChart.legendTitle.font.family,
                }
              },

            },
          },

          //indexAxis: 'x',
          scales: {
            y: {
              beginAtZero: true,
              type: 'linear',
              position: 'right',
              stacked: yStacked,
              border: {
                color: paramChart.axisY.border.color,
                width: paramChart.axisY.border.width
              },
              ticks: {
                // stepSize:0.7,
                color: paramChart.axisY.ticks.color,
              }
            },
            x: {

              stacked: xStacked,
              border: {
                color: paramChart.axisX.border.color,
                width: paramChart.axisX.border.width
              },
              ticks: {
                color: paramChart.axisX.ticks.color,
              }
            },
          },

          aspectRatio: theRatio,
        },
      });
    }
    return chartResult;
  }
