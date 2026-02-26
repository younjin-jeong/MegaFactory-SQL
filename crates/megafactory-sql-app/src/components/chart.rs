use leptos::prelude::*;
use megafactory_sql_types::metrics::MetricPoint;

/// Chart type selector.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ChartType {
    Line,
    Bar,
}

/// A data series for the chart.
#[derive(Debug, Clone)]
pub struct ChartSeries {
    pub label: String,
    pub color: String,
    pub data: Vec<MetricPoint>,
}

/// SVG chart configuration.
#[derive(Debug, Clone)]
pub struct ChartConfig {
    pub title: String,
    pub chart_type: ChartType,
    pub series: Vec<ChartSeries>,
    pub height: u32,
    pub y_label: String,
}

/// SVG chart component rendering inline SVG.
#[component]
pub fn SvgChart(config: ChartConfig) -> impl IntoView {
    let width: f64 = 600.0;
    let height = config.height as f64;
    let padding_left = 60.0;
    let padding_right = 20.0;
    let padding_top = 10.0;
    let padding_bottom = 30.0;
    let chart_width = width - padding_left - padding_right;
    let chart_height = height - padding_top - padding_bottom;

    // Find global min/max across all series
    let (min_val, max_val) = {
        let mut min = f64::MAX;
        let mut max = f64::MIN;
        for s in &config.series {
            for p in &s.data {
                if p.value < min {
                    min = p.value;
                }
                if p.value > max {
                    max = p.value;
                }
            }
        }
        if (max - min).abs() < 0.001 {
            (min - 1.0, max + 1.0)
        } else {
            let margin = (max - min) * 0.1;
            (min - margin, max + margin)
        }
    };

    let y_range = max_val - min_val;

    // Y-axis labels (5 ticks)
    let y_ticks: Vec<(f64, String)> = (0..=4)
        .map(|i| {
            let val = min_val + y_range * (i as f64 / 4.0);
            let label = format_value(val);
            let y = padding_top + chart_height - (chart_height * (i as f64 / 4.0));
            (y, label)
        })
        .collect();

    // Grid lines
    let grid_lines: Vec<f64> = (0..=4)
        .map(|i| padding_top + chart_height - (chart_height * (i as f64 / 4.0)))
        .collect();

    let title = config.title.clone();

    // Render series
    let series_views: Vec<_> = config
        .series
        .iter()
        .map(|series| {
            let n = series.data.len();
            if n == 0 {
                return view! { <g></g> }.into_any();
            }

            match config.chart_type {
                ChartType::Line => {
                    let points: String = series
                        .data
                        .iter()
                        .enumerate()
                        .map(|(i, p)| {
                            let x = padding_left
                                + (i as f64 / (n.max(1) - 1).max(1) as f64) * chart_width;
                            let y = padding_top + chart_height
                                - ((p.value - min_val) / y_range * chart_height);
                            format!("{x:.1},{y:.1}")
                        })
                        .collect::<Vec<_>>()
                        .join(" ");
                    let color = series.color.clone();
                    view! {
                        <g>
                            <polyline
                                fill="none"
                                stroke=color
                                stroke-width="2"
                                points=points
                            />
                        </g>
                    }
                    .into_any()
                }
                ChartType::Bar => {
                    let bar_width = if n > 0 {
                        (chart_width / n as f64) * 0.7
                    } else {
                        chart_width
                    };
                    let gap = if n > 0 { chart_width / n as f64 } else { 0.0 };
                    let color = series.color.clone();
                    let bars: Vec<_> = series
                        .data
                        .iter()
                        .enumerate()
                        .map(|(i, p)| {
                            let x = padding_left + (i as f64 * gap) + (gap - bar_width) / 2.0;
                            let bar_h = ((p.value - min_val) / y_range * chart_height).max(1.0);
                            let y = padding_top + chart_height - bar_h;
                            let color = color.clone();
                            view! {
                                <rect
                                    x=format!("{x:.1}")
                                    y=format!("{y:.1}")
                                    width=format!("{bar_width:.1}")
                                    height=format!("{bar_h:.1}")
                                    fill=color
                                    rx="2"
                                />
                            }
                        })
                        .collect();
                    view! {
                        <g>{bars}</g>
                    }
                    .into_any()
                }
            }
        })
        .collect();

    // X-axis labels (show ~6 timestamps)
    let x_labels: Vec<_> = if !config.series.is_empty() && !config.series[0].data.is_empty() {
        let data = &config.series[0].data;
        let n = data.len();
        let step = (n / 6).max(1);
        data.iter()
            .enumerate()
            .filter(|(i, _)| i % step == 0)
            .map(|(i, p)| {
                let x = padding_left + (i as f64 / (n.max(1) - 1).max(1) as f64) * chart_width;
                let label = format_timestamp(p.timestamp);
                (x, label)
            })
            .collect()
    } else {
        vec![]
    };

    // Legend
    let legend: Vec<_> = config
        .series
        .iter()
        .map(|s| {
            let color = s.color.clone();
            let label = s.label.clone();
            (color, label)
        })
        .collect();

    view! {
        <div class="chart-container" style=format!("height:{}px", config.height)>
            <div class="chart-title">{title}</div>
            <div class="chart-body">
                <svg
                    viewBox=format!("0 0 {width} {height}")
                    preserveAspectRatio="xMidYMid meet"
                    class="chart-svg"
                >
                    // Grid lines
                    {grid_lines.iter().map(|y| {
                        view! {
                            <line
                                x1=format!("{padding_left}")
                                y1=format!("{y:.1}")
                                x2=format!("{}", width - padding_right)
                                y2=format!("{y:.1}")
                                class="chart-grid-line"
                            />
                        }
                    }).collect::<Vec<_>>()}

                    // Y-axis labels
                    {y_ticks.iter().map(|(y, label)| {
                        view! {
                            <text
                                x=format!("{}", padding_left - 8.0)
                                y=format!("{y:.1}")
                                class="chart-y-label"
                                text-anchor="end"
                                dominant-baseline="middle"
                            >
                                {label.clone()}
                            </text>
                        }
                    }).collect::<Vec<_>>()}

                    // X-axis labels
                    {x_labels.iter().map(|(x, label)| {
                        view! {
                            <text
                                x=format!("{x:.1}")
                                y=format!("{}", height - 5.0)
                                class="chart-x-label"
                                text-anchor="middle"
                            >
                                {label.clone()}
                            </text>
                        }
                    }).collect::<Vec<_>>()}

                    // Data series
                    {series_views}
                </svg>
            </div>
            {if legend.len() > 1 {
                Some(view! {
                    <div class="chart-legend">
                        {legend.iter().map(|(color, label)| {
                            let color = color.clone();
                            view! {
                                <span class="chart-legend-item">
                                    <span class="chart-legend-dot" style=format!("background:{color}") />
                                    {label.clone()}
                                </span>
                            }
                        }).collect::<Vec<_>>()}
                    </div>
                })
            } else {
                None
            }}
        </div>
    }
}

fn format_value(v: f64) -> String {
    if v.abs() >= 1_000_000.0 {
        format!("{:.1}M", v / 1_000_000.0)
    } else if v.abs() >= 1_000.0 {
        format!("{:.1}k", v / 1_000.0)
    } else if v.abs() < 10.0 {
        format!("{:.1}", v)
    } else {
        format!("{:.0}", v)
    }
}

fn format_timestamp(ts: f64) -> String {
    let secs = ts as u64;
    let hours = (secs / 3600) % 24;
    let mins = (secs / 60) % 60;
    format!("{hours:02}:{mins:02}")
}
