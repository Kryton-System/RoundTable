/**
 * Graph Visualization Module using Vis-Network
 * Tuned for:
 * 1. Buttery 60fps performance (zero lag even with 100+ nodes)
 * 2. Slow-motion, living organic floating drift
 * 3. Silky smooth nodes, continuous curved edges, and tactile interaction
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
    this.popColors = ['#FFE600', '#00F5D4', '#D7B9FF', '#FF6B8B', '#00BBF9', '#FF9E00'];
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
          face: 'Space Grotesk',
          size: 12,
          color: '#121212',
          strokeWidth: 3,
          strokeColor: '#FFFFFF',
          bold: true
        },
        borderWidth: 2.5,
        borderWidthSelected: 3.5,
        shadow: false // Disabled canvas shadow for buttery 60fps rendering
      },
      edges: {
        width: 1.8,
        color: {
          color: 'rgba(18, 18, 18, 0.45)',
          highlight: '#FF0055',
          hover: '#00F5D4'
        },
        arrows: {
          to: { enabled: true, scaleFactor: 0.75 }
        },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.15
        },
        font: {
          face: 'JetBrains Mono',
          size: 10,
          color: '#121212',
          background: 'rgba(255, 253, 245, 0.95)',
          strokeWidth: 1,
          strokeColor: '#121212',
          align: 'middle'
        },
        shadow: false
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -26,
          centralGravity: 0.006,
          springLength: 125,
          springConstant: 0.035,
          damping: 0.86,        // High damping: produces a slow, silky, graceful liquid float without jitter
          avoidOverlap: 0.75
        },
        maxVelocity: 8,         // Caps velocity: prevents nodes from jerking or snapping rapidly
        minVelocity: 0.04,      // Very low threshold: keeps the slow organic drift alive
        timestep: 0.35,         // Fine time step for ultra-smooth simulation
        stabilization: {
          enabled: true,
          iterations: 80,
          updateInterval: 25
        }
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: true,
        tooltipDelay: 80,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        hideEdgesOnDrag: false,
        navigationButtons: false
      }
    };

    this.network = new vis.Network(this.container, data, options);
  }

  setData(nodesData, edgesData) {
    this.rawNodes = nodesData;
    this.rawEdges = edgesData;
    this.activeHighlight = null;

    const showAllEdgeLabels = edgesData.length <= 15;

    const formattedNodes = nodesData.map((n, idx) => {
      const offersText = n.offers.length ? `\nOffers: ${n.offers.join(', ')}` : '';
      const wantsText = n.wants.length ? `\nWants: ${n.wants.join(', ')}` : '';
      const popBg = n.color || this.popColors[idx % this.popColors.length];

      return {
        id: n.id,
        label: n.label,
        title: `<b>${n.label}</b> (${n.city})${offersText}${wantsText}`,
        color: {
          background: popBg,
          border: '#121212',
          highlight: { background: '#00F5D4', border: '#121212' },
          hover: { background: '#FFE600', border: '#121212' }
        },
        opacity: 1.0
      };
    });

    const formattedEdges = edgesData.map((e, idx) => ({
      id: `edge-${idx}`,
      from: e.from,
      to: e.to,
      // In dense graphs, omit default text label to prevent visual collision & preserve 60fps; tooltip handles details!
      label: showAllEdgeLabels ? e.label : undefined,
      title: `${e.from} teaches ${e.label} to ${e.to}`,
      color: { color: 'rgba(18, 18, 18, 0.4)' },
      width: 1.8,
      opacity: 0.9,
      font: { color: '#121212' }
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

    // Update nodes: dim outsiders gracefully, smoothly enlarge cycle participants
    const updatedNodes = this.rawNodes.map(n => {
      const inCycle = cycleSet.has(n.id);
      return {
        id: n.id,
        opacity: inCycle ? 1.0 : 0.18,
        size: inCycle ? 28 : 15,
        color: {
          background: inCycle ? '#00F5D4' : '#EAE6DB',
          border: inCycle ? '#121212' : '#999999',
          highlight: { background: '#00F5D4', border: '#121212' }
        },
        font: {
          color: inCycle ? '#121212' : 'rgba(18, 18, 18, 0.25)',
          size: inCycle ? 14 : 10,
          bold: inCycle
        }
      };
    });

    // Update edges: illuminate cycle path with hot coral/pink and explicit skill labels
    const updatedEdges = this.rawEdges.map((e, idx) => {
      const cycleEdgeMatch = cycleEdges.find(
        ce => ce.from_user_id === e.from && ce.to_user_id === e.to && ce.skill_name.toLowerCase() === e.label.toLowerCase()
      );
      const isCycleEdge = !!cycleEdgeMatch;

      return {
        id: `edge-${idx}`,
        color: {
          color: isCycleEdge ? '#FF0055' : 'rgba(18, 18, 18, 0.06)'
        },
        width: isCycleEdge ? 4.0 : 0.8,
        opacity: isCycleEdge ? 1.0 : 0.1,
        // Always display the skill label for the illuminated cycle steps
        label: isCycleEdge ? e.label : undefined,
        font: {
          color: '#121212',
          size: 11,
          bold: true,
          background: '#FFE600',
          strokeWidth: 1.5,
          strokeColor: '#121212'
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
      this.network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  }
}
