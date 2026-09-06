/**
 * Graph Visualization Module using Vis-Network
 * Handles rendering the interactive barter graph and highlighting multi-party trade cycles.
 */

class GraphVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.network = null;
    this.nodesDataSet = new vis.DataSet([]);
    this.edgesDataSet = new vis.DataSet([]);
    this.rawNodes = [];
    this.rawEdges = [];
    this.activeHighlight = null;
    this.init();
  }

  init() {
    const data = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet
    };

    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          face: 'Plus Jakarta Sans',
          size: 12,
          color: '#F8FAFC',
          strokeWidth: 2,
          strokeColor: '#090D16'
        },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.5)',
          size: 8,
          x: 0,
          y: 4
        }
      },
      edges: {
        width: 1.8,
        color: {
          color: 'rgba(99, 102, 241, 0.4)',
          highlight: '#06B6D4',
          hover: '#38BDF8'
        },
        arrows: {
          to: { enabled: true, scaleFactor: 0.7 }
        },
        smooth: {
          type: 'curvedCW',
          roundness: 0.15
        },
        font: {
          face: 'Plus Jakarta Sans',
          size: 10,
          color: '#94A3B8',
          background: 'rgba(9, 13, 22, 0.85)',
          strokeWidth: 0,
          align: 'middle'
        }
      },
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -45,
          centralGravity: 0.015,
          springLength: 110,
          springConstant: 0.08,
          damping: 0.4
        },
        stabilization: { iterations: 120 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        zoomView: true,
        dragView: true
      }
    };

    this.network = new vis.Network(this.container, data, options);
  }

  setData(nodesData, edgesData) {
    this.rawNodes = nodesData;
    this.rawEdges = edgesData;
    this.activeHighlight = null;

    const formattedNodes = nodesData.map(n => {
      const offersText = n.offers.length ? `\nOffers: ${n.offers.join(', ')}` : '';
      const wantsText = n.wants.length ? `\nWants: ${n.wants.join(', ')}` : '';
      return {
        id: n.id,
        label: n.label,
        title: `<b>${n.label}</b> (${n.city})${offersText}${wantsText}`,
        color: {
          background: n.color || '#4F46E5',
          border: '#FFFFFF',
          highlight: { background: '#06B6D4', border: '#FFFFFF' }
        },
        opacity: 1.0
      };
    });

    const formattedEdges = edgesData.map((e, idx) => ({
      id: `edge-${idx}`,
      from: e.from,
      to: e.to,
      label: e.label,
      title: `${e.from} teaches ${e.label} to ${e.to}`,
      color: { color: 'rgba(99, 102, 241, 0.45)' },
      width: 1.8,
      opacity: 1.0,
      font: { color: '#94A3B8' }
    }));

    this.nodesDataSet.clear();
    this.edgesDataSet.clear();
    this.nodesDataSet.add(formattedNodes);
    this.edgesDataSet.add(formattedEdges);

    this.network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
  }

  highlightCycle(cycleUserIds, cycleEdges) {
    this.activeHighlight = { userIds: cycleUserIds, edges: cycleEdges };
    const cycleSet = new Set(cycleUserIds);

    // Update nodes: dim outsiders, glow participants
    const updatedNodes = this.rawNodes.map(n => {
      const inCycle = cycleSet.has(n.id);
      return {
        id: n.id,
        opacity: inCycle ? 1.0 : 0.15,
        size: inCycle ? 26 : 16,
        color: {
          background: inCycle ? '#06B6D4' : '#334155',
          border: inCycle ? '#FFFFFF' : '#475569'
        },
        font: {
          color: inCycle ? '#FFFFFF' : 'rgba(148, 163, 184, 0.3)',
          size: inCycle ? 14 : 10
        }
      };
    });

    // Update edges: highlight exact cycle steps in emerald/cyan, dim others
    const updatedEdges = this.rawEdges.map((e, idx) => {
      // Check if this directed edge is part of the cycle sequence
      const isCycleEdge = cycleEdges.some(
        ce => ce.from_user_id === e.from && ce.to_user_id === e.to && ce.skill_name.toLowerCase() === e.label.toLowerCase()
      );

      return {
        id: `edge-${idx}`,
        color: {
          color: isCycleEdge ? '#10B981' : 'rgba(255, 255, 255, 0.04)'
        },
        width: isCycleEdge ? 3.5 : 0.8,
        opacity: isCycleEdge ? 1.0 : 0.1,
        font: {
          color: isCycleEdge ? '#34D399' : 'rgba(148, 163, 184, 0.1)',
          size: isCycleEdge ? 11 : 8
        }
      };
    });

    this.nodesDataSet.update(updatedNodes);
    this.edgesDataSet.update(updatedEdges);
  }

  resetHighlight() {
    if (!this.activeHighlight) return;
    this.activeHighlight = null;
    this.setData(this.rawNodes, this.rawEdges);
  }

  fit() {
    if (this.network) {
      this.network.fit({ animation: { duration: 500 } });
    }
  }
}
