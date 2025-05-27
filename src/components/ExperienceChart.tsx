import React, {
  forwardRef,
  Ref,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from 'react';

/**
 * Props for ExperienceChart. Extend if you need additional inputs.
 */
export interface ExperienceChartProps {}

/**
 * ExperienceChart renders a bar chart of experience using ECharts
 * Supports forwarded ref to the chart container div
 */
const ExperienceChart = forwardRef<
  HTMLDivElement,
  ExperienceChartProps
>((props, ref: Ref<HTMLDivElement>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<any>(null);

  // Expose the container div to parent via ref
  useImperativeHandle(ref, () => containerRef.current!);

  useEffect(() => {
    if (!containerRef.current) return;

    const initChart = async () => {
      const echartsCore = await import('echarts/core');
      const { BarChart } = await import('echarts/charts');
      const { TooltipComponent, GridComponent } = await import('echarts/components');
      const { CanvasRenderer } = await import('echarts/renderers');
      echartsCore.use([
        BarChart,
        TooltipComponent,
        GridComponent,
        CanvasRenderer,
      ]);
      const chartInstance = echartsCore.init(containerRef.current);
      setChart(chartInstance);

      const option = {
        animation: false,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            data: ['Frontend', 'Backend', 'Базы данных', 'DevOps'],
            axisTick: { alignWithLabel: true },
          },
        ],
        yAxis: [
          { type: 'value', max: 5 },
        ],
        series: [
          {
            name: 'Годы опыта',
            type: 'bar',
            barWidth: '60%',
            data: [
              { value: 4.5, itemStyle: { color: '#6366f1' } },
              { value: 3.5, itemStyle: { color: '#8b5cf6' } },
              { value: 3, itemStyle: { color: '#ec4899' } },
              { value: 2, itemStyle: { color: '#f43f5e' } },
            ],
          },
        ],
      };

      chartInstance.setOption(option as any);
    };

    initChart();

    const handleResize = () => chart?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-60" />;
});

ExperienceChart.displayName = 'ExperienceChart';

export default ExperienceChart;
