/**
 * Created by rupak.karn on 1/11/2016.
 */
/**
 * Deep merge two or more objects and return a third object. If the first argument is
 * true, the contents of the second object is copied into the first object.
 */
function merge() {
  var i, args = arguments, len, ret = {}, doCopy = function (copy, original) {
      var value, key;
      // An object is replacing a primitive
      if (typeof copy !== 'object') {
        copy = {};
      }
      for (key in original) {
        if (original.hasOwnProperty(key)) {
          value = original[key];
          // Copy the contents of objects, but not arrays or DOM nodes
          if (value && typeof value === 'object' && Object.prototype.toString.call(value) !== '[object Array]' && key !== 'renderTo' && typeof value.nodeType !== 'number') {
            copy[key] = doCopy(copy[key] || {}, value);  // Primitives and arrays are copied over directly
          } else {
            copy[key] = original[key];
          }
        }
      }
      return copy;
    };
  // If first argument is true, copy into the existing object. Used in setOptions.
  if (args[0] === true) {
    ret = args[1];
    args = Array.prototype.slice.call(args, 2);
  }
  // For each argument, extend the return
  len = args.length;
  for (i = 0; i < len; i++) {
    ret = doCopy(ret, args[i]);
  }
  return ret;
}
var chartCount = 1;
var defaultChartConfig = {
  title: { text: '' },
  renderOptions: {
    container: 'bubble-chart-container',
    transitionTime: 2050,
    radiusScale: 1,
    zoomThreshold: 5  //type : 'thumbnail'
  },
  tooltipOptions: {
    text: {
      x: '\u25CF',
      y: 'ß'
    },
    precision: 2
  },
  //size : {
  //    width : 600,
  //    height : 400
  //},
  xAxis: {
    numOfTicks: 10,
    gridlines: false,
    labelTexts: {
      max: 'Higher Return',
      min: 'Lower Return'
    }
  },
  yAxis: {
    numOfTicks: 10,
    gridlines: false,
    labelTexts: {
      max: 'Higher Risk',
      min: 'Lower Risk'
    }
  },
  layout: {
    margin: {
      left: 50,
      right: 100,
      top: 50,
      bottom: 20
    }  //margin : {
       //    left : 230,
       //    right : 230,
       //    top : 50,
       //    bottom : 10
       //}
  },
  style: {
    border: '1px solid rgb(216, 216, 216)',
    //colors : ["blue","orange", "blue-green","orange-red", "green","red", "red-purple", "yellow-green",]
    colors: [
      '187BD6',
      'FF7B00',
      'DE0000',
      '429C21',
      '8C108C',
      '9CC610',
      'AD0842',
      '298C7B',
      '0086FF'
    ]
  },
  series : [
         {
             name :"Retirement",
             cx :0,
             cy :0.5,
             r : 20,
             color : "red"
         },
         {
             name :"Portfolio 1",
             cx :2.9,
             cy :1.8,
             r : 20,
             color : "blue"
         },
         {
             name :"Portfolio 2",
             cx :-1.9,
             cy :0.2,
             r : 20,
             color : "green"
         },
         {
             name :"Portfolio 3",
             cx :2,
             cy :0.5,
             r : 20,
             color : "orange"
         },
         {
             name :"Kids Ed.",
             cx :4,
             cy :4,
             r : 20,
             color : "orange"
         },
         {
             name :"University",
             cx :-4,
             cy :-4,
             r : 20,
             color : "brown"
         }
      ]
};
function renderBubbleChart(configuration) {
  //Object holding chart configurations
  // var config = merge(defaultChartConfig, configuration);
  var config = configuration;
  //Obtain the container on which the chart is to be rendered
  var container = document.getElementById(config.renderOptions.container);
  $('#' + config.renderOptions.container).empty();
  var containerWidth = container.clientWidth;
  var containerHeight = container.clientHeight;
  if (config.size) {
    if (config.size.height) {
      containerHeight = config.size.height;
    }
    if (config.size.width) {
      containerWidth = config.size.width;
    }
  }
  if (config.title.text !== '') {
    config.layout.margin.top = 60;
  }
  //Calculate width and height of actual svg container i.e. rendering area for chart
  var width = containerWidth - config.layout.margin.left - config.layout.margin.right;
  var height = containerHeight - config.layout.margin.top - config.layout.margin.bottom;
  //Root SVG Element for chart
  var svg = d3.select('#' + config.renderOptions.container).append('svg').attr('width', containerWidth).attr('height', containerHeight).style('border', config.style.border || '').style('background', 'white').append('g').attr('transform', 'translate(' + config.layout.margin.left + ',' + config.layout.margin.top + ')');
  if (config.renderOptions.type === 'thumbnail') {
    svg.style('font-size', '5px');
  }
  //Append invisible rectangle to enable zoom even when pointer is on blank area
  svg.append('svg:rect').attr('width', containerWidth).attr('height', containerHeight).attr('fill', 'white');
  if (config.title.text !== '') {
    svg.append('text').attr('x', containerWidth * 0.41)  //.attr("x", (containerWidth / 3.8))
.attr('y', 0 - config.layout.margin.top / 2).attr('text-anchor', 'middle').style('font-size', '16px').style('color', '#333333')  //.style("text-decoration", "underline")
.text(config.title.text);
  }
  var currentScaleFactor = 1;
  var currentTranslationVector = [
    0,
    0
  ];
  var prevD3ScaleFactor = 1;
  var xScale, yScale;
  var tip;
  var seriesIds = [];
  var chartDivSelector = '#' + config.renderOptions.container;
  var seriesIdPostfix = '-circle-' + config.renderOptions.container;
  var colorGradientPostfix = '-color-' + config.renderOptions.container + '-' + chartCount;
  chartCount += 1;
  var prevZoomTime = new Date();
  var bounds = [
    [
      -10,
      10
    ],
    [
      -1.5,
      1.5
    ]
  ];
  function initChart() {
    attachColor();
    //Calculate the minimum and maximum values along the co-ordinate axes,
    // so as to accomodate only the values between those
    var bounds = calculateExtremeDataValues(config.series);
    //calculateScale sets the value of xScale and yScale
    calculateScale(bounds);
    //uses xScale and yScale to generate co-ordinate axes
    drawAxes();
    //enable the appearance or tooltip when mouse is hovered on any of the circles
    enableTooltip();
    //create radial gradients to be used by circles later
    config.series.map(function (single_ser) {
      createGradient(single_ser.color);
    });
    //create circles with appropriate (cx, cy, r) values
    createCirclesFromData(config.series);
    //enable the functionality of any of the series to be used as reference
    //i.e. Movement of circle to the origin and corresponding change to other circles when clicked on
    attachCircleClickHandler();
    //enable the zoomin and zoomout functionalities
    enableZoomFeature();
  }
  function attachColor() {
    var length = config.style.colors.length - 1;
    for (var i = 0; i < config.series.length; i++) {
      config.series[i].color = config.style.colors[i % length];
    }
  }
  /**
     * Iterate through the cx and cy of all the series to calculate the extreme values
     * Needed for defining scale of the chart
     * @param   {Array} series Object holding values to be plotted
     * @returns {Array} [bounds_x, bounds_y] Array of arrays, each array holding max and min values for corresponding axes
     */
  function calculateExtremeDataValues(series) {
    var bounds_x = d3.extent(series.map(function (single_series) {
      return single_series.cx;
    }));
    var bounds_y = d3.extent(series.map(function (single_series) {
      return single_series.cy;
    }));
    return bounds;  //return [[-100,100], [-1,1]];
                    //return [bounds_x, bounds_y];
  }
  /**
     * Calculate scale from the bounds and set xScale and yScale
     * @param   {Array} bounds Array holding bounds of x-axis and y-axis, bounds[bounds_x, bounds_y]
     * @returns {Array} scales Array of scales, along x-axis and y-axis, [xScale, yScale]
     */
  function calculateScale(bounds) {
    var bounds_x = bounds[0], bounds_y = bounds[1];
    xScale = d3.scale.linear().domain(bounds_x).range([
      0,
      width
    ]);
    yScale = d3.scale.linear().domain(bounds_y).range([
      height,
      0
    ]);
    return [
      xScale,
      yScale
    ];
  }
  /**
     * Draw Axes
     * @param   {scales} Array holding bounds of x-axis and y-axis, bounds[bounds_x, bounds_y]
     * @returns {bounds} Array of scales, along x-axis and y-axis, [xScale, yScale]
     */
  function drawAxes() {
    var xAxis = d3.svg.axis().scale(xScale).orient('bottom').ticks(config.xAxis.numOfTicks);
    var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(config.yAxis.numOfTicks);
    if (config.xAxis.gridlines) {
      xAxis.tickSize(-height, 0, 0).tickFormat('');
    }
    if (config.yAxis.gridlines) {
      yAxis.tickSize(-width, 0, 0).tickFormat('');
    }
    if (config.renderOptions.type !== 'thumbnail') {
      //x-axis
      var xAxisGroup = svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height / 2 + ')').call(xAxis);
      xAxisGroup.append('text').attr('transform', 'translate(0,' + -height / 2 + ')').text(config.xAxis.labelTexts.max).attr('x', xScale(0.8 * bounds[0][1])).attr('y', yScale(bounds[1][1] / 10)).attr('class', 'axisLabel');
      xAxisGroup.append('text').attr('transform', 'translate(0,' + -height / 2 + ')').text(config.xAxis.labelTexts.min).attr('x', xScale(1 * bounds[0][0])).attr('y', yScale(-bounds[1][1] / 5)).attr('class', 'axisLabel');
      // y-axis
      var yAxisGroup = svg.append('g').attr('class', 'y axis').attr('transform', 'translate(' + width / 2 + ', 0)').call(yAxis);
      yAxisGroup.append('text')  //.attr("transform", "rotate(-90)")
.attr('transform', 'translate(' + -width / 2 + ',' + -height / 2 + ')').text(config.yAxis.labelTexts.max).attr('x', xScale(0.05 * bounds[0][1])).attr('y', yScale(0)).attr('class', 'axisLabel');
      yAxisGroup.append('text').attr('transform', 'translate(' + -width / 2 + ',' + height / 2 + ')').text(config.yAxis.labelTexts.min).attr('x', xScale(0.05 * bounds[0][1])).attr('y', yScale(0)).attr('class', 'axisLabel');
    } else {
      xAxis.ticks(0);
      yAxis.ticks(0);
      //x-axis
      var xAxisGroup = svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height / 2 + ')').style('fill', 'none').style('stroke', 'rgb(216, 216, 216)').style('stroke-width', '1').style('stop-opacity', '1').style('shape-rendering', 'crispEdges').call(xAxis);
      // y-axis
      var yAxisGroup = svg.append('g').attr('class', 'y axis').attr('transform', 'translate(' + width / 2 + ', 0)').style('fill', 'none').style('stroke', 'rgb(216, 216, 216)').style('stroke-width', '1').style('stop-opacity', '1').style('shape-rendering', 'crispEdges').call(yAxis);
    }
  }
  /**
     * Create gradients that is to be used by circles
     * @param   {String} color  Name of color whose gradient is to be created
     */
  function createGradient(color) {
    //Define the gradient
    var gradient = svg.append('svg:defs').append('svg:radialGradient').attr('id', color + colorGradientPostfix).attr('cx', '50%').attr('cy', '50%').attr('fx', '50%').attr('fy', '50%').attr('r', '50%').attr('spreadMethod', 'pad');
    //Define the gradient colors -- color at center
    gradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#' + color).attr('stop-opacity', 1);
    //Define the gradient colors -- color at circumference
    gradient.append('svg:stop').attr('offset', '100%').attr('stop-color', '#F4F4F4').attr('stop-opacity', 1);
  }
  /**
     * Create gradients that is to be used by circles
     * @param {String} color  Name of color whose gradientID in dom is required
     * @return {String} gradientId ID of the gradient that is readily available for use
     */
  function getGradientId(color) {
    var gradientId = 'url(#' + color + colorGradientPostfix + ')';
    return gradientId;
  }
  /**
     * Create gradients that is to be used by circles
     * @param {Array} series  Array containing data to be plotted
     * @param {Array} scales Array of scaling function, along x-axis and y-axis, [xScale, yScale]
     * @return {String} gradientId ID of the gradient that is readily available for use
     */
  function createCirclesFromData(series) {
    var circleElems = svg.selectAll(chartDivSelector + ' circle').data(series).enter();
    circleElems.append('circle').attr('class', 'circle').attr('id', function (single_series) {
      seriesIds.push(single_series.name + seriesIdPostfix);
      return single_series.name + seriesIdPostfix;
    }).attr('cx', function (single_series) {
      return xScale(single_series.cx);
    }).attr('cy', function (single_series) {
      return yScale(single_series.cy);
    }).attr('r', function (single_series) {
      return single_series.r * config.renderOptions.radiusScale;
    }).attr('data-legend', function (single_series) {
      return single_series.name;
    }).style('fill', function (single_series) {
      return '#' + single_series.color;  //return getGradientId(single_series.color);
    }).on('mouseover', tip.show).on('mouseout', tip.hide);
  }
  function updateAxesChanges() {
    var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
    var yAxis = d3.svg.axis().scale(yScale).orient('left');
    svg.select(chartDivSelector + ' .x.axis')  // change the x axis
.transition().duration(config.renderOptions.transitionTime).call(xAxis);
    svg.select(chartDivSelector + ' .y.axis')  // change the y axis
.transition().duration(config.renderOptions.transitionTime).call(yAxis);
  }
  function updateCircleChangesWithScale(series) {
    var circle = chartDivSelector + ' .circle';
    svg.selectAll(circle)  // change the line
.data(series).transition().duration(config.renderOptions.transitionTime).attr('cx', function (single_series) {
      return xScale(single_series.cx + currentTranslationVector[0]);
    }).attr('cy', function (single_series) {
      return yScale(single_series.cy + currentTranslationVector[1]);
    }).attr('r', function (single_series) {
      return single_series.r;
    }).style('fill', function (single_series) {
      return '#' + single_series.color;  //return getGradientId(d.color);
    });
  }
  function attachCircleClickHandler(scales) {
    var dx, dy;
    var circle = chartDivSelector + ' circle';
    $(circle).click(function () {
      //console.log('Handling event for', config.renderOptions.container);
      var clickedElement = $(this);
      d3.selectAll(circle).each(function (single_series, i) {
        var currentElement = $(this);
        if (clickedElement[0] === currentElement[0]) {
          dx = -single_series.cx;
          dy = -single_series.cy;
        }
      });
      d3.selectAll(circle).each(function (single_series, i) {
        var currentX = single_series.cx;
        var currentY = single_series.cy;
        d3.select(this).transition().duration(700).attr('cx', xScale(currentX + dx)).attr('cy', yScale(currentY + dy));
      });
      currentTranslationVector[0] = dx;
      currentTranslationVector[1] = dy;  //d3.selectAll(".circlelabeltop").each(function (d, i) {
                                         //    currentX = xAxisScale(d[0]) + padding.left;
                                         //    currentY = yAxisScale(d[1]) + padding.top;
                                         //
                                         //
                                         //    d3.select(this)
                                         //        .transition()
                                         //        .attr("dx", xAxisScale(d[0] - Number(dx)) + padding.left)
                                         //        .attr("dy", yAxisScale(d[1] - Number(dy) + 0.5) + padding.top);
                                         //
                                         //});
                                         //
                                         //d3.selectAll(".circlelabelbottom").each(function (d, i) {
                                         //    currentX = xAxisScale(d[0]) + padding.left
                                         //    currentY = yAxisScale(d[1]) + padding.top + 15
                                         //
                                         //    d3.select(this)
                                         //        .transition().attr("dx", xAxisScale(d[0] - Number(dx)) + padding.left)
                                         //        .attr("dy", yAxisScale(d[1] - Number(dy) + 0.5) + padding.top + 15);
                                         //});
    });
  }
  function enableZoomFeature() {
    function zoomCallback() {
      //$('.d3-tip').hide();
      //if (d3.event.sourceEvent.touches.length == 1)
      //    return;
      //if(currentScaleFactor>=5 || currentScaleFactor<=0.2){
      //    return;
      //}
      var currentZoomTime = new Date();
      if (prevD3ScaleFactor > d3.event.scale) {
        if (currentScaleFactor >= 5) {
          return;
        }
        if (!is_touch_device()) {
          currentScaleFactor *= 2;
        } else {
          //console.log('On touch device');
          if (currentZoomTime - prevZoomTime < 1) {
            prevZoomTime = currentZoomTime;
            //console.log('escaped zoom in');
            return;
          } else {
            currentScaleFactor *= 1.1;
          }
        }
      } else {
        if (currentScaleFactor <= 0.2) {
          return;
        }
        if (!is_touch_device()) {
          currentScaleFactor *= 0.5;
        } else {
          //console.log('On touch device');
          if (currentZoomTime - prevZoomTime < 0) {
            prevZoomTime = currentZoomTime;
            //console.log('escaped zoom out');
            return;
          } else {
            currentScaleFactor *= 0.9091;
          }
        }
      }
      prevD3ScaleFactor = d3.event.scale;
      var bounds = calculateExtremeDataValues(config.series);
      bounds[0][0] = bounds[0][0] * currentScaleFactor;
      bounds[0][1] = bounds[0][1] * currentScaleFactor;
      bounds[1][0] = bounds[1][0] * currentScaleFactor;
      bounds[1][1] = bounds[1][1] * currentScaleFactor;
      calculateScale(bounds);
      updateAxesChanges();
      updateCircleChangesWithScale(config.series);
    }
    var zoom = d3.behavior.zoom().on('zoom', zoomCallback);
    svg.call(zoom).on('dblclick.zoom', null).on('mousedown.zoom', null);
  }
  function attachOnHoverEffect() {
    var circle = chartDivSelector + ' circle';
    $(circle).click(function () {
      var clickedElement = $(this);
      d3.selectAll(circle).each(function (single_series, i) {
        var currentElement = $(this);
        if (clickedElement[0] === currentElement[0]) {
          dx = -single_series.cx;
          dy = -single_series.cy;
        }
      });
      d3.selectAll(circle).each(function (single_series, i) {
        var currentX = single_series.cx;
        var currentY = single_series.cy;
        d3.select(this).transition().attr('cx', xScale(currentX + dx)).attr('cy', yScale(currentY + dy));
      });
      currentTranslationVector[0] = dx;
      currentTranslationVector[1] = dy;  //d3.selectAll(".circlelabeltop").each(function (d, i) {
                                         //    currentX = xAxisScale(d[0]) + padding.left;
                                         //    currentY = yAxisScale(d[1]) + padding.top;
                                         //
                                         //
                                         //    d3.select(this)
                                         //        .transition()
                                         //        .attr("dx", xAxisScale(d[0] - Number(dx)) + padding.left)
                                         //        .attr("dy", yAxisScale(d[1] - Number(dy) + 0.5) + padding.top);
                                         //
                                         //});
                                         //
                                         //d3.selectAll(".circlelabelbottom").each(function (d, i) {
                                         //    currentX = xAxisScale(d[0]) + padding.left
                                         //    currentY = yAxisScale(d[1]) + padding.top + 15
                                         //
                                         //    d3.select(this)
                                         //        .transition().attr("dx", xAxisScale(d[0] - Number(dx)) + padding.left)
                                         //        .attr("dy", yAxisScale(d[1] - Number(dy) + 0.5) + padding.top + 15);
                                         //});
    });
  }
  function enableTooltip() {
    tip = d3.tip().attr('class', 'd3-tip').offset([
      0,
      0
    ]).html(function (single_ser) {
      return '<div style="font-size: 12px"><span style="color:#' + single_ser.color + '">' + '\u25CF' + single_ser.name + '</span><br><br><b>' + config.tooltipOptions.text.x + '  : </b>' + single_ser.cx.toFixed(config.tooltipOptions.precision) + '&nbsp;&nbsp; <b>' + config.tooltipOptions.text.y + ' : </b>' + single_ser.cy.toFixed(config.tooltipOptions.precision) + '</div>';  //return '<div style="font-size: 12px"><span style="color:' + single_ser.color + '">\u25CF' + single_ser.name +'</span><br><br><b>α : </b>'+single_ser.cx+'&nbsp;&nbsp; <b>ß : </b>'+single_ser.cy+'</div>';
                                                                                                                                                                                                                                                                                                                                                                                          //return "<strong>"+single_ser.name+"</strong><br/> <span style='color:red'>" + "α = " + single_ser.cx + "  ß= " + single_ser.cy + "</span>";
    });
    svg.call(tip);
  }
  function createLegends() {
    var legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(50,30)')  //.style("font-size","12px")
.call(d3.legend);  //setTimeout(function() {
                   //    legend
                   //        .style("font-size","20px")
                   //        .style("background","#fff")
                   //        .attr("data-style-padding",10)
                   //        .call(d3.legend)
                   //},1000);
  }
  initChart();
  //createLegends();
  function is_touch_device() {
    return 'ontouchstart' in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
  return {
    getSVG: function () {
      var svg_ = $('#' + config.renderOptions.container).html();
      return svg_;
    }
  };
}

renderBubbleChart(defaultChartConfig);