'use client';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { Parlementarian, getParlementarians } from './data/sparql';

interface HemicycleProps {
  width?: number;
  height?: number;
}

// new react component for hemicycle visualisation
// https://observablehq.com/@piecesofuk/uk-parliament-party-totals
const Hemicycle = (props: HemicycleProps) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const { width = 928, height = 500 } = props;

  const parlementarians: Promise<Parlementarian[]> = getParlementarians(
    '2021-01-01T00:00:00Z'
  );

  useEffect(() => {
    const svg = d3
      .select(ref.current!)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    d3.json(await parlementarians).then((data) => {
      const datapoints: Parlementarian[] = data.map(
        (d: d3.DSVRowString<string>) => ({
          mp: d.mp,
          mpLabel: d.mpLabel,
          constituency: d.constituency,
          constituencyLabel: d.constituencyLabel,
          partyTextLabel: d.partyTextLabel,
          genderLabel: d.genderLabel,
          rgb: d.rgb,
          age: d.age,
        })
      );

      const radius = 20;
      const totalSeats = datapoints.length;
      if (datapoints.length == 0) return 'No data to display';
      const numberOfRings = findN(totalSeats, radius);
      const a0 = findA(totalSeats, numberOfRings, radius); // calculate seat distance
      let points = [];

      // calculate ring radii
      var rings = [];
      for (var i = 1; i <= numberOfRings; i++) {
        rings[i] = radius - (i - 1) * a0;
      }
      // calculate seats per ring
      rings = distribute(rings, totalSeats);

      var resultsList = [];
      var r, a, point;

      // build seats
      // loop rings
      var ring;
      for (var j = 1; j <= numberOfRings; j++) {
        ring = [];
        // calculate ring-specific radius
        r = radius - (j - 1) * a0;
        // calculate ring-specific distance
        a = (Math.PI * r) / (rings[j] - 1 || 1);

        // loop points
        for (let k = 0; k <= rings[j] - 1; k++) {
          point = getCoordinates(r, k * a);
          point[2] = 0.4 * a0;
          ring.push(point);
        }
        points.push(ring);
      }

      // fill seats
      var ringProgress = Array(points.length).fill(0);
      // for(var party in partyTotals) {
      // let key = partyTotals[party].key;
      // 	for(var l=0; l<parseInt(partyTotals[party].value); l++){
      // 		ring = nextRing(points, ringProgress)
      // 		points[ring][ringProgress[ring]][3] = partyTotals[party].rgb;
      // 		points[ring][ringProgress[ring]][4] = key; // the Parliamentary group
      // 		ringProgress[ring]++
      // 	}
      // }
      for (let i = 0; i < partyTotals.length; i++) {
        let key = partyTotals[i][0];
        for (let l = 0; l < partyTotals[i][1]; l++) {
          ring = nextRing(points, ringProgress);
          points[ring][ringProgress[ring]][3] = partyTotals[i][2];
          points[ring][ringProgress[ring]][4] = key; // the Parliamentary group
          ringProgress[ring]++;
        }
      }
      points = merge(points);

      // add code to store the MPs' name, QID URL and gender
      for (let i = 0; i < datapoints.length; i++) {
        for (let j = 0; j < points.length; j++) {
          if (
            datapoints[i].partyTextLabel.value == points[j][4] &&
            points[j].length == 5
          ) {
            // points[j][5] = data[i].mpLabel.value;
            // points[j][6] = data[i].mp.value;
            // points[j][7] = data[i].genderLabel.value;
            // points[j][8] = i; // store the index of the data
            points[j][5] = i; // store the index of the data
            break;
          }
        }
      }

      var a = points[0][2] / 0.1;
      svg.attr(
        'viewBox',
        [-radius - a / 2, -radius - a / 2, 2 * radius + a, radius + a].join(',')
      );

      let anchors = svg
        .selectAll('a')
        .data(points)
        .join('a')
        //      .attr("href", d => d[6])
        .attr('href', (d) => datapoints[d[5]].mp.value)
        .attr('target', '_blank');

      let count = 0;

      // svg.selectAll("circle")
      //     .data(points)
      //     .enter()
      //     .append("circle")
      //     .attr("cx", d => d[0])
      //     .attr("cy", d => d[1])
      //     .attr("r", d => d[2])
      //     .attr("fill", d => d[3])
      //     .append("title").text(d => d[4])

      anchors
        .append('circle')
        .attr('cx', (d) => d[0])
        .attr('cy', (d) => d[1])
        .attr('r', (d) => d[2])
        .attr('fill', (d) => d[3])
        .style('opacity', function (d) {
          if (applyFilters(d)) {
            ++count;
            return 1;
          }
          return 0.1;
        })
        //      .append("title").text(d => `${d[5]} (${d[4]})`); //   // add code to store the MPs' name and QID URL
        .append('title')
        .text((d) => `${datapoints[d[5]].mpLabel.value} (${d[4]})`); //   // add code to store the MPs' name and QID URL
    });
  }, [height, width]);
};

function filterByGender(datapoints, d) {
  let dataItem = datapoints[d[5]];
  for (let i = 0; i < selectGender.length; i++) {
    //    if (d[7] == selectGender[i]) return true;
    if (dataItem.genderLabel.value == selectGender[i]) return true;
  }
  return false;
}
function filterByParty(d) {
  for (let i = 0; i < selectParty.length; i++) {
    if (d[4] == selectParty[i]) return true;
  }
  return false;
}

function filterByAge(datapoints, d) {
  let dataItem = datapoints[d[5]];
  if (dataItem.age.value >= selectAge[0] && dataItem.age.value <= selectAge[1])
    return true;
  return false;
}

function applyFilters(d) {
  let filters = [filterByGender, filterByParty, filterByAge];
  for (let f = 0; f < filters.length; f++) {
    if (filters[f](d)) continue;
    else return false;
  }
  return true;
}

function findN(m, r) {
  var n = Math.floor(Math.log(m) / Math.log(2)) || 1;
  var distance = getScore(m, n, r);

  var direction = 0;
  if (getScore(m, n + 1, r) < distance) direction = 1;
  if (getScore(m, n - 1, r) < distance && n > 1) direction = -1;

  while (getScore(m, n + direction, r) < distance && n > 0) {
    distance = getScore(m, n + direction, r);
    n += direction;
  }
  return n;
}

function findA(m, n, r) {
  var x = (Math.PI * n * r) / (m - n);
  var y = 1 + (Math.PI * (n - 1) * n) / 2 / (m - n);

  var a = x / y;
  return a;
}

function getScore(m, n, r) {
  return Math.abs((findA(m, n, r) * n) / r - 5 / 7);
}

function distribute(votes, seats) {
  // initial settings for divisor finding
  var voteSum = 0;
  for (var party in votes) {
    voteSum += votes[party];
  }
  var low = voteSum / (seats - 2);
  var high = voteSum / (seats + 2);
  var divisor = voteSum / seats;

  var parliament = calculateSeats(votes, divisor);

  // find divisor
  while (parliament.seats != seats) {
    if (parliament.seats < seats) low = divisor;
    if (parliament.seats > seats) high = divisor;
    divisor = (low + high) / 2;
    parliament = calculateSeats(votes, divisor);
  }

  return parliament.distribution;
}

function calculateSeats(votes, divisor) {
  var distribution = {};
  var seats = 0;
  for (var party in votes) {
    distribution[party] = Math.round(votes[party] / divisor);
    seats += distribution[party];
  }
  return { distribution, seats };
}

function getCoordinates(r, b) {
  var x = parseFloat(r * Math.cos(b / r - Math.PI)).toFixed(10);
  var y = parseFloat(r * Math.sin(b / r - Math.PI)).toFixed(10);
  return [x, y];
}

function nextRing(rings, ringProgress) {
  var progressQuota, tQuota;
  for (var i in rings) {
    tQuota = parseFloat((ringProgress[i] || 0) / rings[i].length).toFixed(10);
    if (!progressQuota || tQuota < progressQuota) progressQuota = tQuota;
  }
  for (var j in rings) {
    tQuota = parseFloat((ringProgress[j] || 0) / rings[j].length).toFixed(10);
    if (tQuota == progressQuota) return j;
  }
}

function merge(arrays) {
  var result = [];
  for (var list of arrays) result = result.concat(list);
  return result;
}

export default Hemicycle;
