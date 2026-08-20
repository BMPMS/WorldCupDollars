let chartData = {};
let currentWidth = 0;
let animationGroupHeight = 0;
let animationWidthRatio = 1;

const colors = {
    playerIn: "#009A4E",
    valueIn: "#009A4E",
    out: "#8EA09E",
    title: "#125746",
    titleLight: "#3A6E63",
    subtitle: "#56B8D2",
    text: "#F09639",
    background: "#E5FEFB"
};

const margin = {
    left: 140,
    right: 140,
    top: 220,
    bottom: 220,
    gap: 150,
    out: 65,
    middle: 140 - (65 * 2)/2
}


const measureWidth = (text, fontSize) => {
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${fontSize}px Arial`;
    return context.measureText(text).width;
}
const sankeyLinkVertical = (margin) => {
    function verticalSource(d) {
        return [d.y0, d.source.x1];
    }
    function verticalTarget(d) {
        if (d.target.type === "out") {
            return [-margin.out + (d.target.y1 - d.target.y0) / 2, d.target.x0];
        }
        return [d.y1, d.target.x0];
    }
    return d3.linkVertical().source(verticalSource).target(verticalTarget);
}

const sankeyLinkVerticalReverse = (width, margin, targetWidth) => {
    function verticalSource(d) {
        return [width - d.y0, d.source.x1];
    }
    function verticalTarget(d) {
        if (d.target.type === "out") {
            // change needed here
            return [width - targetWidth / 2 + margin.out, d.target.x0];
        }
        return [width - d.y1, d.target.x0];
    }
    return d3.linkVertical().source(verticalSource).target(verticalTarget);
}

let totalRounds = 0;;

const getPlayerNodes = (players, data,nodeWidth,groupIndex) => {
    const sorted = players.sort((a, b) => d3.descending(a.type, b.type));
    const extraRounds = (totalRounds - 1)  - groupIndex;
    const finalRectYForward =  (extraRounds  * animationGroupHeight);
    const finalRectYBack = -((nodeWidth + 10) * extraRounds )
    const nodes = [];
    const top5Value = data.top5Teams.count;
    sorted.forEach((node) => {
        const width = node.y1 - node.y0;
        const isOut = node.type === "out";
        const reverseX = isOut ? width - margin.out : node.y1;
        const top5Width = width * (top5Value/data.players);
        const newNode = {
            x: -reverseX,
            y: node.x0,
            finalRectY:  finalRectYForward + finalRectYBack,
            width,
            top5Width:  node.type === "in" ? top5Width : 0,
            top5X: -reverseX,
            height: nodeWidth,
            fill: isOut ? colors.out : colors.playerIn,
            direction: node.type,
            type: "player",
            data,
            groupIndex
        };
        nodes.push(newNode);
    });

    return nodes;
};

const getValueNodes = (players, data,nodeWidth,groupIndex) => {
    const sorted = players.sort((a, b) => d3.descending(a.type, b.type));
    const extraRounds = (totalRounds - 1) - groupIndex;
    const finalRectYForward = (extraRounds  * animationGroupHeight);
    const finalRectYBack = -((nodeWidth + 10) * extraRounds );
    const nodes = [];
    const top5Value = data.top5Players.value;
    sorted.forEach((node) => {
        const width = node.y1 - node.y0;
        const isOut = node.type === "out";
        const x = (isOut ? -margin.out : node.y0) + margin.gap;
        const top5Width = width * (top5Value/data.value);
        const newNode = {
            x,
            y: node.x0,
            finalRectY: finalRectYForward + finalRectYBack,
            width,
            top5Width:  node.type === "in" ? top5Width : 0,
            top5X: x + (width - top5Width),
            height: nodeWidth,
            fill: isOut ? colors.out : colors.valueIn,
            direction: node.type,
            type: "value",
            data,
            groupIndex
        };
        nodes.push(newNode);
    });

    return nodes;
};
const getPlayerLinkPaths = (playerLinks,group, targetWidth, sankeyHeight) =>
    playerLinks
        .filter((f) => f.parentGroup === group)
        .map((m) => ({
            path: sankeyLinkVerticalReverse(sankeyHeight, margin, targetWidth)(m),
            stroke: m.type === "in" ? colors.playerIn : colors.out,
            width: m.width,
            type: "player"
        }));

const getValueLinkPaths = (valueLinks,group,sankeyHeight) =>
    valueLinks
        .filter((f) => f.parentGroup === group)
        .map((m) => ({
            path: sankeyLinkVertical(margin)(m),
            stroke: m.type === "in" ? colors.valueIn : colors.out,
            width: m.width,
            type: "value"
        }));

const drawSankey = (div, data, windowWidth, windowHeight) => {

    const {sankeyData, allRounds} = data;
    totalRounds = allRounds.length;
    const valueFormat = d3.format("$,.2r");
    const percentFormat = d3.format(".0%");
    const dateFormat = d3.timeFormat("%d %b %Y");
    const width = 1000;
    const multiple = 6;
    const height = width * multiple;
    const nodeWidth = multiple * 8;
    animationWidthRatio = windowWidth >= 1000 ? 1 : windowWidth/width;


    let svg = div.select(".sankeyBaseSvg");

    if (svg.empty()) {
        svg = div.append("svg").attr("class","noselect sankeyBaseSvg");
        svg.append("text").attr("class","fa alwaysVisible playerIcon");
        svg.append("text").attr("class","fa alwaysVisible valueIcon");
        svg.append("circle").attr("class","fa alwaysVisible playerFootball");
        svg.append("text").attr("class","topPlayers")
        svg.append("text").attr("class","topPlayers2")
        svg.append("text").attr("class","topTeams")
        svg.append("text").attr("class","topTeams2")
        svg.append("text").attr("class","finalPlayersLabel");
        svg.append("text").attr("class","finalValueLabel");
        svg.append("text").attr("class","untilNextTimeLabel");


    }

    svg.attr("viewBox", `0 0 ${width},${height}`)
      //  .attr("width",`${windowWidth}px`)
      //  .attr("height",`${windowWidth * multiple}px`);

    div
      //  .style("width",`${windowWidth}px`)
       // .style("height",`${windowWidth * multiple}px`);

    const largeFontSize = 32;
    const midFontSize = 24;
    const smallFontSize = 14;

    const { playerNodes, playerLinks, valueNodes, valueLinks } = sankeyData;

    const sankeyWidth = height - margin.top - margin.bottom;
    const sankeyHeight = (width - margin.left - margin.right - margin.gap) / 2;
    const nodePadding = 10;

    svg.select(".topPlayers")
        .attr("text-anchor","end")
        .style("dominant-baseline","middle")
        .attr("pointer-events","none")
        .attr("font-size",smallFontSize)
        .attr("fill",colors.text)
        .attr("x", margin.left + sankeyHeight * 2 + margin.gap )
        .attr("y",margin.top - 24)
        .text("Top 5")

    svg.select(".topPlayers2")
        .attr("text-anchor","end")
        .style("dominant-baseline","middle")
        .attr("pointer-events","none")
        .attr("font-size",smallFontSize)
        .attr("fill",colors.text)
        .attr("x", margin.left + sankeyHeight * 2 + margin.gap )
        .attr("y",margin.top - 10)
        .text("Players")

    svg.select(".topTeams")
        .attr("text-anchor","start")
        .style("dominant-baseline","middle")
        .attr("pointer-events","none")
        .attr("font-size",smallFontSize)
        .attr("fill",colors.text)
        .attr("x", margin.left )
        .attr("y",margin.top - 24)
        .text("Top 5")

    svg.select(".topTeams2")
        .attr("text-anchor","start")
        .style("dominant-baseline","middle")
        .attr("pointer-events","none")
        .attr("font-size",smallFontSize)
        .attr("fill",colors.text)
        .attr("x", margin.left)
        .attr("y",margin.top - 10)
        .text("Teams")


    svg.select(".playerIcon")
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("pointer-events","none")
        .attr("font-size",120)
        .attr("fill",colors.title)
        .attr("x", margin.left + sankeyHeight/2)
        .attr("y",margin.top - 90)
        .text("\uf70c")

    svg.select(".playerFootball")
        .attr("r",10)
        .attr("fill",colors.title)
        .attr("cx", margin.left + sankeyHeight/2 + 35)
        .attr("cy",margin.top - 36)

    svg.select(".valueIcon")
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",120)
        .attr("pointer-events","none")
        .attr("fill",colors.title)
        .attr("x", margin.left + (sankeyHeight * 1.5) + margin.gap )
        .attr("y",margin.top - 90)
        .text("\uf81d")


    const sankey = d3
        .sankey()
        .nodeId((d) => d.id)
        .nodeAlign(d3.sankeyLeft)
        .nodeSort(
            (a, b) => d3.descending(a.type, b.type) || d3.descending(a.order, b.order)
        )
        .linkSort(
            (a, b) => d3.descending(a.type, b.type) || d3.descending(a.order, b.order)
        )
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .extent([
            [0, 0],
            [sankeyWidth, sankeyHeight]
        ]);

    sankey({ nodes: playerNodes, links: playerLinks });
    sankey({ nodes: valueNodes, links: valueLinks });

     animationGroupHeight =
        playerLinks.length === 0
            ? 0
            : playerLinks[0].target.x0 - playerLinks[0].source.x0;


    const finalTop = margin.top + ((totalRounds-1) * animationGroupHeight) - ((totalRounds-1) * (nodeWidth + 10)) - nodeWidth * 0.3;

    svg.select(".finalPlayersLabel")
        .style("opacity", 0)
        .attr("x",margin.left)
        .attr("y", finalTop )
        .attr("font-size",largeFontSize)
        .attr("fill",colors.title)
        .text("Teams");

    svg.select(".finalValueLabel")
        .style("opacity", 0)
        .attr("x",margin.left + sankeyHeight * 2 + margin.gap )
        .attr("text-anchor","end")
        .attr("y", finalTop )
        .attr("font-size",largeFontSize)
        .attr("fill",colors.title)
        .text("$ Value");

    svg.select(".untilNextTimeLabel")
        .style("opacity", 0)
        .attr("x",margin.left + sankeyHeight + margin.gap/2)
        .attr("text-anchor","middle")
        .attr("y", finalTop - largeFontSize * 2)
        .attr("font-size",largeFontSize)
        .attr("fill",colors.subtitle)
        .text("... until next time")


    const playerGroupRoundGroups = [...d3.group(playerNodes, (d) => d.name)];
    const valueGroupRoundGroups = [...d3.group(valueNodes, (d) => d.name)];

    const getNodeLabel = (node) => {
        if (node.direction === "in") {
            if (node.type === "player")
                return `${node.data.players} ${node.data.players > 16 ? "teams" : ""}`;
            if (node.type === "value")
                return `${valueFormat(node.data.value/1000)}${
                    node.data.value > 10000 ? " billion" : "b"
                }`;
        }
        if (node.type === "player")
            return node.data.playerPercent === 0
                ? ""
                : percentFormat(node.data.playerPercent);
        return node.data.valuePercent === 0
            ? ""
            : percentFormat(node.data.valuePercent);
    };

    const chartData = allRounds.reduce((acc, entry,i) => {
        const playerGroup = playerGroupRoundGroups.find((f) => f[0] === entry.name);
        const groupPlayerNodes = getPlayerNodes(playerGroup[1], entry,nodeWidth,i);
        const valueGroup = valueGroupRoundGroups.find((f) => f[0] === entry.name);
        const groupValueNodes = getValueNodes(valueGroup[1], entry,nodeWidth,i);
        const nodes = groupPlayerNodes.concat(groupValueNodes);

        //     const reverseX = isOut ? width - margin.out : node.y1;
        // node.x = -reverseX + sankeyHeight;
        let links = [];

        if (entry.nextId) {
            const targetNode = playerNodes.find(
                (f) => f.id === `player_${entry.nextId}_out`
            );

            const targetWidth = targetNode.y1 - targetNode.y0;
            const playerLinkPaths = getPlayerLinkPaths(playerLinks,entry.id, targetWidth,sankeyHeight);
            const valueLinkPaths = getValueLinkPaths(valueLinks, entry.id,sankeyHeight);

            links = playerLinkPaths.concat(valueLinkPaths);
        }
        const nodesWithLabel = nodes.reduce((acc, entry) => {
            const nodeLabel = getNodeLabel(entry);
            const labelWidth = measureWidth(nodeLabel,largeFontSize);
            const labelFits = (labelWidth + 5)  < entry.width
            let labelX = entry.x + entry.width/2;
            let labelTextAnchor = "middle";
            let labelFill = "white";
            if(!labelFits){
                let direction = 'left';
                if(entry.type === "value" && entry.direction === "out"){
                    direction = 'right';
                }
                if(entry.type === "player" && entry.direction === "in"){
                    direction = 'right';
                }
                if(direction === 'left'){
                    labelX = entry.x -5;
                    labelTextAnchor = "end";
                    labelFill = colors.title;
                } else {
                    labelX = entry.x + entry.width + 5;
                    labelTextAnchor = "start";
                    labelFill = colors.title;
                }
            }
              acc.push ({...entry,
            nodeLabel,
                labelX,
                labelTextAnchor,
                labelFill
            })
            return acc;


        },[])

        const previousName = i === 0 ? "" : allRounds[i - 1].name;
        acc.push({
            name: entry.name,
            previousName,
            startDate: entry.startDate,
            matchCount: entry.matchCount,
            venueCount: entry.venueCount,
            countryCount: entry.countryCount,
            goalCount: entry.goalCount,
            nodes: nodesWithLabel,
            links
        });

        return acc;
    }, []);

    const labelMidPoint = animationGroupHeight * 0.4;
    const roundsGroup = svg
        .selectAll(".roundsGroup")
        .data(chartData)
        .join((group) => {
            const enter = group.append("g").attr("class", "roundsGroup");
            enter.append("g").attr("class", "linkGroup");
            enter.append("rect").attr("class","animationRect");
            enter.append("text").attr("class", "groupLabel");
            enter.append("text").attr("class", "groupDateLabel");
            enter.append("text").attr("class", "fa groupGoalIcon");
            enter.append("text").attr("class", "groupMatches");
            enter.append("text").attr("class", "groupGoals");
            enter.append("text").attr("class", "fa groupGlobeIcon");
            enter.append("text").attr("class", "groupVenues");
            enter.append("text").attr("class", "groupCountries");
            enter.append("text").attr("class", "outLabelPlayer");
            enter.append("text").attr("class", "outLabelValue");
            enter.append("text").attr("class", "outLabelPlayerExtra");
            enter.append("text").attr("class", "outLabelValueExtra");
            enter.append("g").attr("class", "nodeGroup");
             return enter;
        });

    roundsGroup
        .attr("id",(d,i) => `roundsGroup${i}`)
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("opacity", 1)
        .transition()
        .delay((d, i) => i * 2000)
        .duration(500)
        .attr("opacity", 1);

    roundsGroup
        .select(".groupLabel")
        .style("opacity",0)
        .attr("x", sankeyHeight + margin.gap / 2)
        .attr("y", (d, i) => labelMidPoint - largeFontSize + i * animationGroupHeight)
        .style("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("font-size", largeFontSize)
        .attr("fill", colors.title)
        .text((d) => d.name);

    roundsGroup
        .select(".groupDateLabel")
        .style("opacity",0)
        .attr("x", sankeyHeight + margin.gap / 2)
        .attr(
            "y",
            (d, i) => labelMidPoint + 4 + i * animationGroupHeight
        )
        .style("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("font-size", largeFontSize * 0.9)
        .attr("fill", colors.subtitle)
        .text((d) => dateFormat(new Date(d.startDate)));

    roundsGroup.select(".groupGoalIcon")
        .style("opacity",0)
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",40)
        .attr("pointer-events","none")
        .attr("fill",colors.title)
        .attr("x",  sankeyHeight/2 )
        .attr("y", (d, i) => labelMidPoint - 50 + i * animationGroupHeight)
        .text("\uf1e3");


    roundsGroup.select(".groupMatches")
        .style("opacity",0)
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",midFontSize)
        .attr("pointer-events","none")
        .attr("fill",colors.text)
        .attr("x",  sankeyHeight/2 )
        .attr("y", (d, i) => labelMidPoint + i * animationGroupHeight)
        .text((d) => `${d.matchCount} ${d.matchCount === 1 ? 'match' : 'matches'}`);

    roundsGroup.select(".groupGoals")
        .style("opacity",0)
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",midFontSize)
        .attr("pointer-events","none")
        .attr("fill",colors.text)
        .attr("x",  sankeyHeight/2 )
        .attr("y", (d, i) => labelMidPoint + midFontSize * 1.2 + i * animationGroupHeight)
        .text((d) => `${d.goalCount} ${d.goalCount === 1 ? 'goal': 'goals'}`);

    roundsGroup.select(".groupGlobeIcon")
        .style("opacity",0)
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",40)
        .attr("pointer-events","none")
        .attr("fill",colors.title)
        .attr("x",  margin.gap + sankeyHeight * 1.5 )
        .attr("y", (d, i) => labelMidPoint - 50 + i * animationGroupHeight)
        .text("\uf57d");

    roundsGroup.select(".groupVenues")
        .style("opacity",0)
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",midFontSize)
        .attr("pointer-events","none")
        .attr("fill",colors.text)
        .attr("x",  margin.gap + sankeyHeight * 1.5 )
        .attr("y", (d, i) => labelMidPoint + i * animationGroupHeight)
        .text((d) => `${d.venueCount} ${d.venueCount === 1 ? 'stadium' :'stadiums'}`);

    roundsGroup.select(".groupCountries")
        .style("opacity",0)
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .attr("font-size",midFontSize)
        .attr("pointer-events","none")
        .attr("fill",colors.text)
        .attr("x",  margin.gap + sankeyHeight * 1.5 )
        .attr("y", (d, i) => labelMidPoint + midFontSize * 1.2 + i * animationGroupHeight)
        .text((d) => `${d.countryCount} ${d.countryCount === 1 ? 'country' :'countries'}`);

    roundsGroup.select(".outLabelPlayer")
        .style("opacity",0)
        .attr("text-anchor","end")
        .style("dominant-baseline","middle")
        .attr("font-size",smallFontSize)
        .attr("pointer-events","none")
        .attr("fill",colors.subtitle)
        .attr("x",   sankeyHeight  + margin.out)
        .attr("y", (d, i) =>  nodeWidth + smallFontSize +  i * animationGroupHeight)
        .text((d,i) => i === 0 ?  "" : d.previousName);

    roundsGroup.select(".outLabelPlayerExtra")
        .style("opacity",0)
        .attr("text-anchor","end")
        .style("dominant-baseline","middle")
        .attr("font-size",smallFontSize)
        .attr("font-weight",300)
        .attr("pointer-events","none")
        .attr("fill",colors.out)
        .attr("x",   sankeyHeight  + margin.out)
        .attr("y", (d, i) =>  nodeWidth + (smallFontSize * 2.2) +  i * animationGroupHeight)
        .text((d,i) => i === 0 ? "" : "players knocked out");

    roundsGroup.select(".outLabelValue")
        .style("opacity",0)
        .attr("text-anchor","start")
        .style("dominant-baseline","middle")
        .attr("font-size",smallFontSize)
        .attr("pointer-events","none")
        .attr("fill",colors.subtitle)
        .attr("x",   + sankeyHeight + margin.gap/2 + 5 )
        .attr("y", (d, i) =>   + nodeWidth + smallFontSize + i * animationGroupHeight)
        .text((d) => d.previousName);

    roundsGroup.select(".outLabelValueExtra")
        .style("opacity",0)
        .attr("text-anchor","start")
        .style("dominant-baseline","middle")
        .attr("font-size",smallFontSize)
        .attr("font-weight",300)
        .attr("pointer-events","none")
        .attr("fill",colors.out)
        .attr("x",   + sankeyHeight + margin.gap/2 + 5 )
        .attr("y", (d, i) =>   + nodeWidth + (smallFontSize * 2.2) + i * animationGroupHeight)
        .text((d,i) => i === 0 ? "" :"$ value lost");

    roundsGroup.select(".animationRect")
        .style("opacity",0)
        .attr("width", width - margin.left - margin.right)
        .style("height",(d,i) => i === chartData.length - 1 ? 0 : animationGroupHeight - nodeWidth)
        .attr("transform", (d,i) => `translate(0, ${ (i === chartData.length - 1 ? animationGroupHeight :  0)})`)
        .attr("fill", colors.background)
        .attr("y",(d,i) =>nodeWidth + i * animationGroupHeight)


    roundsGroup
        .select(".nodeGroup")
        .style("opacity", (d,i) => i === 0 ? 1 : 0)
        .attr("transform", `translate(${sankeyHeight},0)`);

    roundsGroup
        .select(".linkGroup").style("opacity",0);



    const nodesGroup = roundsGroup
        .select(".nodeGroup")
        .selectAll(".nodesGroup")
        .data((d) => d.nodes)
        .join((group) => {
            const enter = group.append("g").attr("class", "nodesGroup");
            enter.append("rect").attr("class", "nodeRect");
            enter.append("rect").attr("class","topPlayerRect");
            enter.append("g").attr("class","topPlayerGroup");
            enter.append("g").attr("class","topTeamGroup");
            enter.append("text").attr("class", "nodeLabel");
            enter.append("text").attr("class","nodeGroupName");
            return enter;
        });

    nodesGroup
        .select(".nodeGroupName")
        .style("opacity",0)
        .attr("data-y",(d) =>d.finalRectY )
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", (d) => d.direction === "in" && d.type === "player"  ? "nodeLabelMove" : "")
        .attr("x",   margin.gap/2)
        .attr("y",  (d) => d.y + nodeWidth/2)
        .style("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("font-size", midFontSize)
        .attr("fill",colors.title)
        .text((d) => allRounds[d.groupIndex].name);

    nodesGroup
        .select(".nodeRect")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", (d) => d.direction === "in"? "nodeRectMove" : "")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("height", (d) => d.height)
        .attr("width", (d) => d.width)
        .attr("fill", (d) => d.fill);

    nodesGroup
        .select(".topPlayerRect")
        .attr("x", (d) => d.top5X)
        .attr("y", (d) => d.y)
        .attr("height", (d) => d.height)
        .attr("width", (d) => d.top5Width)
        .attr("fill", colors.text);

    nodesGroup
        .select(".nodeLabel")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", (d) => d.direction === "in"  ? "nodeLabelMove" : "")
        .attr("x", (d) => d.labelX)
        .attr("y", (d) => nodeWidth * 0.05 + d.y + d.height / 2)
        .style("dominant-baseline", "middle")
        .attr("text-anchor", (d) => d.labelTextAnchor)
        .attr("font-size", largeFontSize)
        .attr("fill",(d) => d.labelFill)
        .text((d) => d.nodeLabel);

    nodesGroup.select(".topTeamGroup")
        .attr("transform", (d) => `translate(${d.x - 5}, ${d.y})`)

    nodesGroup.select(".topPlayerGroup")
        .attr("transform", (d) => `translate(${d.x + d.width + 5}, ${d.y})`)

    const topPlayersGroup = nodesGroup
        .select(".topPlayerGroup")
        .selectAll(".topPlayersGroup")
        .data((d) => {
            if(d.type === "value" && d.direction === "in") {
                let players = d.data.top5Players.playersOut;
                let phrase = 'knocked out';
                if(d.data.name === "Winner"){
                    // hard coding for speed.
                    players = d.data.top5Players.players;
                    phrase = 'in winning team';
                }
                const result = players.map((m,i) => ({
                    player: m,
                    index: i,
                    last: (players.length - 1) === i,
                    groupIndex: d.groupIndex,
                    finalRectY: d.finalRectY,
                    phrase,
                }));
                return result;
            }
            return []
        })
        .join((group) => {
            const enter = group.append("g").attr("class", "topPlayersGroup");
            enter.append("text").attr("class", "playerLabel");
            enter.append("text").attr("class", "outLabel");
            return enter;
        });

    topPlayersGroup.attr("transform",(d) => `translate(0,${(d.index + 0.5) *  (smallFontSize * 1.2)})`)

    topPlayersGroup.select(".playerLabel")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", "nodeLabelMove")
        .style("dominant-baseline", "middle")
        .attr("text-anchor", "left")
        .attr("font-size", smallFontSize)
        .attr("fill",colors.text)
        .text((d) => d.player);

    topPlayersGroup.select(".outLabel")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", "nodeLabelMove")
        .style("dominant-baseline", "middle")
        .attr("y", smallFontSize * 1.2)
        .attr("text-anchor", "left")
        .attr("font-size", smallFontSize)
        .attr("fill",colors.out)
        .text((d) => d.last ? d.phrase: "");

    const circleRadius = smallFontSize/2;
    const topTeamsGroup = nodesGroup
        .select(".topTeamGroup")
        .selectAll(".topTeamsGroup")
        .data((d) => {
            if(d.type === "player" && d.direction === "in") {
                let teams = d.data.top5Teams.teamsOut;
                let phrase = 'knocked out';
                if(d.data.name === "Winner"){
                    // hard coding for speed.
                    teams = [{name: "Spain", flagCode:"es"}]
                    phrase = 'winning team';
                }
                const result = teams.map((m,i) => ({
                    team: m.name,
                    flagCode: m.flagCode,
                    index: i,
                    last: (teams.length - 1) === i,
                    phrase,
                    groupIndex: d.groupIndex,
                    finalRectY: d.finalRectY,
                }));
                return result;
            }
            return []


        })
        .join((group) => {
            const enter = group.append("g").attr("class", "topTeamsGroup");
            enter.append("text").attr("class", "teamLabel");
            enter.append("text").attr("class", "outTeamLabel");
            enter.append("circle").attr("class", "teamCircle");
            const defs = enter.append("defs");
            defs
                .append("pattern")
                .attr("class", "nodePattern")
                .append("svg:image")
                .attr("class", "patternImage");
            return enter;
        });

    topTeamsGroup.attr("transform",(d) => `translate(0,${(d.index + 0.5) * (smallFontSize * 1.2)})`)


    topTeamsGroup
        .select(".nodePattern")
        .attr("id", (d) => `top5CountryImage${d.flagCode}`)
        .attr("width", 1)
        .attr("height", 1);

    topTeamsGroup
        .select(".patternImage")
        .attr(
            "xlink:href",
            (d) => `https://hatscripts.github.io/circle-flags/flags/${d.flagCode}.svg`
        )
        .attr("height", circleRadius * 2)
        .attr("width", circleRadius * 2);

    topTeamsGroup
        .select(".teamCircle")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", "nodeLabelMove")
        .attr("r", circleRadius)
        .attr("cx", (d) => -(measureWidth(d.team,smallFontSize) +12 + circleRadius))
        .attr("cy", -1)
        .attr("fill", (d) => `url(#top5CountryImage${d.flagCode})`);

    topTeamsGroup.select(".teamLabel")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", "nodeLabelMove")
        .style("dominant-baseline", "middle")
        .attr("text-anchor", "end")
        .attr("font-size", smallFontSize)
        .attr("fill",colors.text)
        .text((d) => d.team);

    topTeamsGroup.select(".outTeamLabel")
        .attr("data-y",(d) =>d.finalRectY)
        .attr("data-group-index", (d) => d.groupIndex)
        .attr("id", "nodeLabelMove")
        .style("dominant-baseline", "middle")
        .attr("y", smallFontSize * 1.2)
        .attr("text-anchor", "end")
        .attr("font-size", smallFontSize)
        .attr("fill",colors.out)
        .text((d) => d.last ? d.phrase: "");






    const linksGroup = roundsGroup
        .select(".linkGroup")
        .selectAll(".linksGroup")
        .data((d) => d.links)
        .join((group) => {
            const enter = group.append("g").attr("class", "linksGroup");
            enter.append("path").attr("class", "linkPath");
            return enter;
        });

    linksGroup.attr(
        "transform",
        (d) => `translate(${d.type === "value" ? margin.gap + sankeyHeight : 0},0)`
    );

    linksGroup
        .select(".linkPath")
        .attr("stroke", (d) => d.stroke)
        .attr("stroke-width", (d) => d.width)
        .attr("stroke-opacity", 0.2)
        .attr("fill", "transparent")
        .attr("d", (d) => d.path);

}

    const renderChart = () => {
    const div = d3.select(`#chart-container`);
    const { clientWidth, clientHeight} = div.node();
    if(clientWidth !== currentWidth){
         currentWidth = clientWidth;
        // will have to restart the animation also
        drawSankey(div,chartData, clientWidth,clientHeight);
        console.log(animationGroupHeight)
        initScrollAnimation(margin, animationGroupHeight * animationWidthRatio, animationGroupHeight);
    }

}


const loadChart = async () => {
    const sankeyData = await d3.json("data/sankeyData.json")
    const allRounds = await d3.json("data/allRounds.json")
    chartData = {sankeyData,allRounds};

    renderChart();
}

loadChart();