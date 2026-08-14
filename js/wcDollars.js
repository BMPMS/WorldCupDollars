let chartData = {};
let currentWidth = 0;

const sankeyLinkVertical = () => {
    function verticalSource(d) {
        return [d.y0, d.source.x1];
    }
    function verticalTarget(d) {
        if (d.target.type === "out") {
            return [-30 + (d.target.y1 - d.target.y0) / 2, d.target.x0];
        }
        return [d.y1, d.target.x0];
    }
    return d3.linkVertical().source(verticalSource).target(verticalTarget);
}

const sankeyLinkVerticalReverse = (width, margin) => {
    function verticalSource(d) {
        return [width - d.y0, d.source.x1];
    }
    function verticalTarget(d) {
        if (d.target.type === "out") {
            // change needed here
            return [width + margin.out - d.target.width / 2, d.target.x0];
        }
        return [width - d.y1, d.target.x0];
    }
    return d3.linkVertical().source(verticalSource).target(verticalTarget);
}

const drawSankey = (div, data, width, height) => {

    let svg = div.select(".sankeyBaseSvg");

    if (svg.empty()) {
        svg = div.append("svg").attr("class","noselect sankeyBaseSvg");
    }

    svg.style("background-color","white")
        .attr("width",`${height}px`)
        .attr("height",`${height}px`)
        .style("background-color", "#f0f6fa");

}

    const handleResize = () => {
    const div = d3.select(`#chart-container`);
    const { clientWidth, clientHeight} = div.node();
    if(clientWidth !== currentWidth){
         currentWidth = clientWidth;
        // will have to restart the animation also
        drawSankey(div,chartData, clientWidth,clientHeight);
    }

}


// Add throttled event listener which redraws the tree every 0.1 second rather than nanosecond
window.addEventListener("resize", resizeThrottle());

const loadChart = async () => {
    chartData = await d3.json("data/sankeyData.json")
    handleResize(true);
}

loadChart();