import {
  forwardRef,
  Ref,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from 'react';

/**
 * Props for SkillChart. Extend if you need additional inputs.
 */
export interface SkillChartProps {
  skills: { name: string; value: number }[];
}

/**
 * SkillChart renders a radar chart of skills using ECharts
 * Supports forwarded ref to the chart container div
 */
const SkillChart = forwardRef<HTMLDivElement, SkillChartProps>((props, ref: Ref<HTMLDivElement>) => {
  const { skills } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<any>(null);

  // Expose the container div to parent via ref
  useImperativeHandle(ref, () => containerRef.current!);

  useEffect(() => {
    if (!containerRef.current) return;

    const initChart = async () => {
      const echartsCore = await import('echarts/core');
      const { RadarChart } = await import('echarts/charts');
      const { TooltipComponent, LegendComponent } = await import('echarts/components');
      const { CanvasRenderer } = await import('echarts/renderers');
      echartsCore.use([
        RadarChart,
        TooltipComponent,
        LegendComponent,
        CanvasRenderer,
      ]);
      const chartInstance = echartsCore.init(containerRef.current);
      setChart(chartInstance);

      const option = {
        animation: false,
        radar: {
          indicator: skills.map(skill => ({ name: skill.name, max: 100 })),
          radius: '65%',
          splitNumber: 4,
          axisName: {
            color: '#6366f1',
            fontSize: 12,
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(99, 102, 241, 0.05)', 'rgba(99, 102, 241, 0.1)'],
            },
          },
        },
        series: [
          {
            name: 'Навыки',
            type: 'radar',
            data: [
              {
                value: skills.map(skill => skill.value),
                name: 'Уровень владения',
                areaStyle: {
                  color: 'rgba(99, 102, 241, 0.4)',
                },
                lineStyle: {
                  color: '#6366f1',
                },
                itemStyle: {
                  color: '#6366f1',
                },
              },
            ],
          },
        ],
      };

      chartInstance.setOption(option);
    };

    initChart();

    const handleResize = () => chart?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart?.dispose();
    };
  }, [skills]);

  return <div ref={containerRef} className="w-full h-80" />;
});

SkillChart.displayName = 'SkillChart';

export default SkillChart;
