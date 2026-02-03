'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface Datapoint {
  date: Date;
  close: number;
}

interface LinechartProps {
  width?: number;
  height?: number;
}

interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ChartDims {
  width: number;
  height: number;
  margin: ChartMargin;
}

interface Scales {
  x: d3.ScaleTime<number, number>;
  y: d3.ScaleLinear<number, number, never>;
}

interface BuildScalesOptions {
  datapoints: Datapoint[];
  dims: ChartDims;
}

const buildScales = ({ datapoints, dims }: BuildScalesOptions): Scales => {
  const { width, height, margin } = dims;
  const x = d3
    .scaleUtc()
    .domain(d3.extent(datapoints, d => d.date) as unknown as [Date, Date])
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(datapoints, d => d.close)] as number[])
    .range([height - margin.bottom, margin.top]);
  return { x, y };
};

interface DrawAxesOptions {
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>;
  scales: Scales;
  dims: ChartDims;
}

const drawAxes = ({ svg, scales, dims }: DrawAxesOptions) => {
  const { width, height, margin } = dims;
  const { x, y } = scales;
  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select('.domain').remove())
    .call(g =>
      g
        .selectAll('.tick line')
        .clone()
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1)
    )
    .call(g =>
      g
        .append('text')
        .attr('x', -margin.left)
        .attr('y', 10)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text('↑ Daily close ($)')
    );
};

interface DrawLineOptions {
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>;
  datapoints: Datapoint[];
  scales: Scales;
}

const drawLine = ({ svg, datapoints, scales }: DrawLineOptions) => {
  const { x, y } = scales;
  const line = d3
    .line<Datapoint>()
    .x(d => x(d.date))
    .y(d => y(d.close));
  svg
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', line(datapoints));
};

const Linechart = ({ width = 928, height = 500 }: LinechartProps) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const margin: ChartMargin = { top: 20, right: 30, bottom: 30, left: 40 };
    const dims: ChartDims = { width, height, margin };
    const root = d3.select(ref.current!);
    root.selectAll('*').remove();
    root
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

    d3.csv(
      'https://gist.githubusercontent.com/thoroc/52cde20a73464c8182ad2a737e69267f/raw/6b8c503c4fc1e46a6f9bc3c5091d2385937de5eb/appl.csv'
    ).then(data => {
      const datapoints: Datapoint[] = data.map(d => ({
        date: new Date(d.date as string),
        close: +(d.close as string),
      }));
      const scales = buildScales({ datapoints, dims });
      drawAxes({
        svg: root as unknown as d3.Selection<
          SVGSVGElement | null,
          unknown,
          null,
          undefined
        >,
        scales,
        dims,
      });
      drawLine({
        svg: root as unknown as d3.Selection<
          SVGSVGElement | null,
          unknown,
          null,
          undefined
        >,
        datapoints,
        scales,
      });
    });
  }, [height, width]);

  return <svg width={width} height={height} id='linechart' ref={ref} />;
};

export default Linechart;
