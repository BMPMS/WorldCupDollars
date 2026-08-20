gsap.registerPlugin(ScrollTrigger);

function initScrollAnimation(margin, groupAnimationHeight, viewBoxGroupAnimationHeight) {
    const chartContainer = document.querySelector("#chart-container");
    const svg = chartContainer.querySelector("svg");

    const H = groupAnimationHeight;

    const stage = document.createElement("div");

    stage.style.width = "100%";
    stage.style.height = "100vh";
    stage.style.overflow = "hidden";

    chartContainer.insertBefore(stage, svg);
    stage.appendChild(svg);

    const svgHeight = svg.getBoundingClientRect().height;
    const viewportHeight = window.innerHeight;

    // The amount the SVG actually needs to move
    // for its bottom to reach the bottom of the viewport.
    const totalMovement = svgHeight - viewportHeight;

    gsap.set(svg, {
        y: 0
    });

    const timeline = gsap.timeline({
        scrollTrigger: {
            trigger: chartContainer,
            start: "top top",
            end: `+=${8 * H}`,
            pin: stage,
            scrub: true,
            markers: false
        }
    });

    for (let i = 0; i < 7; i++) {
        const roundsGroup = svg.querySelector(`#roundsGroup${i}`);

        // Hold for 0.5H — split into 5 reveal steps, each 0.125H
        const stepDuration = 1 / 5;

        // Step 1 - nodeGroup
        timeline.to(roundsGroup.querySelectorAll(".nodeGroup"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 2 - outLabels (first nodeGroup visible by default)
        timeline.to(roundsGroup.querySelectorAll(".outLabelPlayer, .outLabelPlayerExtra, .outLabelValue, .outLabelValueExtra"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 3 - reveal groupLabel + date
        timeline.to(roundsGroup.querySelectorAll(".groupLabel, .groupDateLabel"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 4 - reveal groupGoalIcon and groupMatches
        timeline.to(roundsGroup.querySelectorAll(".groupGoalIcon, .groupMatches"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 5 - reveal groupGoals
        timeline.to(roundsGroup.querySelectorAll(".groupGoals"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 6 - reveal groupGlobeIcon and groupVenues
        timeline.to(roundsGroup.querySelectorAll(".groupGlobeIcon, .groupVenues"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 7 - reveal groupCountries
        timeline.to(roundsGroup.querySelectorAll(".groupCountries"), {
            opacity: 1,
            duration: stepDuration
        });

        // Step 7 - reveal groupCountries
        timeline.to(roundsGroup.querySelectorAll(".animationRect,.linkGroup"), {
            opacity: 1,
            duration: 0
        });

        // Step 8 - reveal links + next nodes (by moving animationRect)
        timeline.to(roundsGroup.querySelectorAll(".animationRect"), {
            y: viewBoxGroupAnimationHeight,
            height: 0,
            duration: stepDuration * 3
        });

        // Move to the appropriate position
        timeline.to(svg, {
            y: -Math.min((i + 1) * H, totalMovement),
            duration: 0.2,
            ease: "none"
        }, "<0.1");

    }


    // ... your existing loop that builds the earlier animations goes here ...

    timeline.addLabel("groupsStart"); // marks the end of the previous loop's animations

    timeline.to(
        svg.querySelectorAll(
            '.roundsGroup path, .roundsGroup rect:not(#nodeRectMove), .roundsGroup text:not(#nodeLabelMove)'
        ),
        {
            opacity: 0,
            duration: 0.2,
            ease: "none"
        }, ">0.5"
    );


    const elements = svg.querySelectorAll("#nodeRectMove, #nodeLabelMove, #nodeGroupMove");
    const groups = {};
    elements.forEach((target) => {
        const groupIndex = Number(target.dataset.groupIndex);
        if (!groups[groupIndex]) groups[groupIndex] = [];
        groups[groupIndex].push(target);
    });
    const groupIndices = Object.keys(groups).map(Number);
    const totalGroups = groupIndices.length; // 7
    const landInterval = 0.5;
    const duration = 0.5;
    const firstStart = -0.3;

    groupIndices.forEach((groupIndex) => {
        const order = totalGroups - 1 - groupIndex;
        const startTime = `groupsStart+=${firstStart + order * landInterval}`;

        groups[groupIndex].forEach((target) => {
            const currentY = Number(target.getAttribute("y"));
            const moveY = Number(target.dataset.y);

            timeline.to(
                target,
                {
                    attr: {y: currentY + moveY, cy:currentY + moveY},
                    duration,
                    ease: "power2.out"
                },
                startTime
            );
            if(target.className.baseVal === "nodeGroupName"){
                timeline.to(
                   target,
                    {
                        opacity: 1,
                        duration: 0.2,
                        ease: "none"
                    }
                );
            }
        });
    });


    timeline.to(
        svg.querySelectorAll(
            '.finalValueLabel, .finalPlayersLabel',
        ),
        {
            opacity: 1,
            duration: 0.2,
            ease: "none"
        }
    );

    timeline.to(
        svg.querySelectorAll(
            '.untilNextTimeLabel',
        ),
        {
            opacity: 1,
            duration: 0.2,
            ease: "none"
        }
    );

    // Give the final group some breathing room
    timeline.to({}, { duration: 2 });

}