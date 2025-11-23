import React, { useEffect, useRef } from 'react';
import { select, hierarchy, tree, linkHorizontal } from 'd3';
import { WorkflowNode, PressureState, OperationState } from '../types';

interface DecisionTreeProps {
  data: WorkflowNode;
  pressures: PressureState;
  operation: OperationState;
}

export const DecisionTree: React.FC<DecisionTreeProps> = ({ data, pressures, operation }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Clear previous render
    select(svgRef.current).selectAll("*").remove();

    const containerWidth = wrapperRef.current.clientWidth;
    const containerHeight = wrapperRef.current.clientHeight;
    
    // Create hierarchy
    const root = hierarchy(data);
    
    // Calculate dynamic dimensions based on tree complexity
    const leaves = root.leaves().length;
    const depth = root.height; 

    // Margins
    // Right margin must accommodate the card width (160px) + offset
    const margin = { top: 40, right: 220, bottom: 40, left: 100 };
    
    // Vertical Layout Calculation
    const nodeVerticalSpacing = 80; 
    const minHeight = containerHeight > 0 ? containerHeight - margin.top - margin.bottom : 500;
    const calculatedHeight = leaves * nodeVerticalSpacing;
    // Ensure we fill the container at minimum, but grow if needed
    const height = Math.max(minHeight, calculatedHeight) + margin.top + margin.bottom;

    // Horizontal Layout Calculation
    const nodeHorizontalSpacing = 240;
    
    // Calculate width needed for the tree structure alone (nodes connections)
    const requiredTreeWidth = depth * nodeHorizontalSpacing;
    
    // Calculate available width for the tree structure within container
    const availableTreeWidth = containerWidth - margin.left - margin.right;
    
    // If content is smaller than container, stretch to fit container (looks better).
    // If content is larger, use required width (triggers scrollbar).
    const treeLayoutWidth = Math.max(requiredTreeWidth, availableTreeWidth);
    
    // Total SVG width
    const width = treeLayoutWidth + margin.left + margin.right;
    
    // Define tree layout
    // The size is [height, width] for the drawing area logic
    const treeLayout = tree<WorkflowNode>()
        .size([height - margin.top - margin.bottom, treeLayoutWidth])
        .separation((a, b) => (a.parent == b.parent ? 1.1 : 1.25));

    treeLayout(root);

    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Determine active path
    root.descendants().forEach((d) => {
        if (!d.parent) {
            (d as any).isActivePath = true;
        } else {
            const parentActive = (d.parent as any).isActivePath;
            const nodeLogicActive = d.data.isActive ? d.data.isActive(pressures, operation) : false;
            (d as any).isActivePath = parentActive && nodeLogicActive;
        }
    });

    // Links
    svg.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr("fill", "none")
      .attr("stroke", (d: any) => d.target.isActivePath ? "#3b82f6" : "#cbd5e1")
      .attr("stroke-width", (d: any) => d.target.isActivePath ? 3 : 1.5)
      .attr("opacity", (d: any) => d.target.isActivePath ? 1 : 0.5);

    // Nodes
    const node = svg.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Node Card
    const rectWidth = 160; 
    const rectHeight = 56; 

    node.append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("x", -10) // Slight offset to verify connection point
      .attr("y", -28) // Centered vertically
      .attr("rx", 8)
      .attr("fill", (d: any) => {
          if (d.isActivePath) {
              if (d.data.type === 'action') return '#dcfce7'; // green-100
              if (d.data.type === 'check') return '#fef9c3'; // yellow-100
              return '#dbeafe'; // blue-100
          }
          return '#f8fafc';
      })
      .attr("stroke", (d: any) => d.isActivePath ? "#2563eb" : "#94a3b8")
      .attr("stroke-width", (d: any) => d.isActivePath ? 2.5 : 1.5)
      .attr("filter", "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))");

    // Labels
    node.append("text")
      .attr("dy", -5)
      .attr("x", (rectWidth - 20) / 2)
      .attr("text-anchor", "middle")
      .text(d => d.data.label)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b");

    // Details
    node.append("text")
      .attr("dy", 14)
      .attr("x", (rectWidth - 20) / 2)
      .attr("text-anchor", "middle")
      .text(d => d.data.detail ? (d.data.detail.length > 22 ? d.data.detail.substring(0, 21) + '...' : d.data.detail) : '')
      .attr("font-size", "10px")
      .attr("fill", "#64748b");

  }, [data, pressures, operation]);

  return (
    <div ref={wrapperRef} className="w-full h-full overflow-auto bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
      <svg ref={svgRef} className="block" />
    </div>
  );
};