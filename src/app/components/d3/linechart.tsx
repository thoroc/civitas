'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface Datapoint {
  date: Date;
  close: number;
}

const Linechart = () => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Declare the chart dimensions and margins.
    const width = 928;
    const height = 500;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    const svg = d3
      .select(ref.current!)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

    d3.csv(
      'https://gist.githubusercontent.com/thoroc/52cde20a73464c8182ad2a737e69267f/raw/6b8c503c4fc1e46a6f9bc3c5091d2385937de5eb/appl.csv'
    ).then((data) => {
      const datapoints: Datapoint[] = data.map(
        (d: d3.DSVRowString<string>) => ({
          date: new Date(d.date),
          close: +d.close,
        })
      );

      const x = d3
        .scaleUtc()
        .domain(
          d3.extent(datapoints, function (d: Datapoint) {
            return d.date;
          }) as unknown as [Date, Date]
        )
        .range([marginLeft, width - marginRight]);

      // Declare the y (vertical position) scale.
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.close)] as number[])
        .range([height - marginBottom, marginTop]);

      // Declare the line generator.
      const line = d3
        .line<Datapoint>()
        .x((d) => x(d.date))
        .y((d) => y(d.close));

      // Add the x-axis.
      svg
        .append('g')
        .attr('transform', `translate(0,${height - marginBottom})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(width / 80)
            .tickSizeOuter(0)
        );

      // Add the y-axis, remove the domain line, add grid lines and a label.
      svg
        .append('g')
        .attr('transform', `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call((g) => g.select('.domain').remove())
        .call((g) =>
          g
            .selectAll('.tick line')
            .clone()
            .attr('x2', width - marginLeft - marginRight)
            .attr('stroke-opacity', 0.1)
        )
        .call((g) =>
          g
            .append('text')
            .attr('x', -marginLeft)
            .attr('y', 10)
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'start')
            .text('↑ Daily close ($)')
        );

      // Append a path for the line.
      svg
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', line(data as unknown as Datapoint[]));
      // })
      // .catch((error) => {
      //   console.error('Error:', error);
    });
  }, []);

  return <svg width={460} height={400} id="linechart" ref={ref} />;
};

export default Linechart;
