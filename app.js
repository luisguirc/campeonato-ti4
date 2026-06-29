// TI4 BR Player Profile Dashboard Controller

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize DOM Elements References
  const els = {
    // Filters
    filterInterest: document.getElementById('filter-interest'),
    filterState: document.getElementById('filter-state'),
    filterExperience: document.getElementById('filter-experience'),
    filterStyle: document.getElementById('filter-style'),
    filterExpansions: document.getElementById('filter-expansions'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    
    // Counter Info
    filteredCount: document.getElementById('filtered-count'),
    totalCount: document.getElementById('total-count'),
    filteredPercent: document.getElementById('filtered-percent'),
    
    // KPIs
    kpiTotalRespondents: document.getElementById('kpi-total-respondents'),
    kpiConfirmedPlayers: document.getElementById('kpi-confirmed-players'),
    kpiPotentialPlayers: document.getElementById('kpi-potential-players'),
    kpiExpansionsSummary: document.getElementById('kpi-expansions-summary'),
    
    // Lists & Dynamic Containers
    listPlayPartners: document.getElementById('list-play-partners'),
    listPointsGoal: document.getElementById('list-points-goal'),
    listSetupPreferences: document.getElementById('list-setup-preferences'),
    listFactionsFavorites: document.getElementById('list-factions-favorites'),
    listFactionsUnpopular: document.getElementById('list-factions-unpopular'),
    suggestionsList: document.getElementById('suggestions-list'),
    listWhatsappContacts: document.getElementById('list-whatsapp-contacts'),
    listEmailContacts: document.getElementById('list-email-contacts'),
    availabilityHeatmap: document.getElementById('availability-heatmap'),
    
    // Planner
    plannerActiveCount: document.getElementById('planner-active-count'),
    plannerTablesCalc: document.getElementById('planner-tables-calc'),
    plannerSort: document.getElementById('planner-sort'),
    plannerAlgorithm: document.getElementById('planner-algorithm'),
    btnGenerateTables: document.getElementById('btn-generate-tables'),
    plannerTablesContainer: document.getElementById('planner-tables-container'),
    
    // Text insights
    insightGeography: document.getElementById('insight-geography'),
    insightExperience: document.getElementById('insight-experience'),
    insightFrequency: document.getElementById('insight-frequency')
  };

  // 2. Global Chart Instances Object
  const charts = {};

  // Color Palette Constants for Charts
  const colors = {
    indigo: 'rgba(99, 102, 241, 0.7)',
    indigoSolid: 'rgb(99, 102, 241)',
    purple: 'rgba(168, 85, 247, 0.7)',
    purpleSolid: 'rgb(168, 85, 247)',
    teal: 'rgba(20, 184, 166, 0.7)',
    tealSolid: 'rgb(20, 184, 166)',
    blue: 'rgba(59, 130, 246, 0.7)',
    blueSolid: 'rgb(59, 130, 246)',
    amber: 'rgba(245, 158, 11, 0.7)',
    amberSolid: 'rgb(245, 158, 11)',
    crimson: 'rgba(239, 68, 68, 0.7)',
    crimsonSolid: 'rgb(239, 68, 68)',
    gray: 'rgba(100, 116, 139, 0.7)',
    graySolid: 'rgb(100, 116, 139)',
    gridColor: 'rgba(255, 255, 255, 0.08)',
    textColor: '#e2e8f0',
    backgrounds: [
      'rgba(99, 102, 241, 0.65)',
      'rgba(20, 184, 166, 0.65)',
      'rgba(59, 130, 246, 0.65)',
      'rgba(245, 158, 11, 0.65)',
      'rgba(168, 85, 247, 0.65)',
      'rgba(239, 68, 68, 0.65)',
      'rgba(236, 72, 153, 0.65)',
      'rgba(14, 165, 233, 0.65)'
    ]
  };

  // Full set of all 30 factions (base + PoK + Thunder's Edge fan factions)
  const ALL_FACTIONS = [
    'Arborec', 'Argent', 'Creuss', 'Crimson', 'Deepwrought', 'Empyrean', 
    'Firmament/Obsidian', 'Hacan', 'Jol-Nar', 'Keleres', 'L1z1x', 'Last Bastion', 
    'Letnev', 'Mahact', 'Mentak', 'Muaat', 'Naalu', 'Naaz-Rokha', 'Nekro', 
    'Nomad', 'Ral-Nel', 'Saar', 'Sardakk', 'Sol', 'Titans', "Vuil'Raith", 'Winnu', 
    'Xxcha', 'Yin', 'Yssaril'
  ];

  // Custom tooltips showing percentage and absolute value
  const tooltipPercentageCallback = {
    callbacks: {
      label: function(context) {
        let label = context.dataset.label || '';
        if (label) {
          label += ': ';
        }
        
        let val = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
        if (context.parsed.x !== undefined && context.chart.options.indexAxis === 'y') {
          val = context.parsed.x;
        }

        const dataset = context.chart.data.datasets[context.datasetIndex];
        const total = dataset.data.reduce((a, b) => a + b, 0);
        const pct = total > 0 ? Math.round((val / total) * 100) : 0;

        return `${label}${val} (${pct}%)`;
      }
    }
  };

  // Dynamic table layout solver
  function solveTableDistribution(N, allowGhosts) {
    if (N < 5) return { error: true, message: `Número de jogadores (${N}) é insuficiente (mínimo de 5).` };
    
    // Try to find a combination with the minimum number of ghosts (g).
    // If allowGhosts is false, we restrict g to 0. If it's true, we allow g up to 4.
    const maxG = allowGhosts ? 4 : 0;
    
    for (let g = 0; g <= maxG; g++) {
      const target = N + g;
      const solutions = [];
      
      const max6 = Math.floor(target / 6);
      const max5 = Math.floor(target / 5);
      const max7 = Math.floor(target / 7);
      
      for (let x = 0; x <= max6; x++) {
        for (let y = 0; y <= max5; y++) {
          for (let z = 0; z <= max7; z++) {
            if (6 * x + 5 * y + 7 * z === target) {
              solutions.push({ x, y, z });
            }
          }
        }
      }
      
      if (solutions.length > 0) {
        // Sort solutions:
        // 1. Minimize z (lower z comes first: a.z - b.z)
        // 2. Maximize x (higher x comes first: b.x - a.x)
        // 3. Maximize y (higher y comes first: b.y - a.y)
        solutions.sort((a, b) => {
          if (a.z !== b.z) return a.z - b.z;
          if (a.x !== b.x) return b.x - a.x;
          return b.y - a.y;
        });
        
        const best = solutions[0];
        return {
          x: best.x,
          y: best.y,
          z: best.z,
          ghosts: g,
          totalTables: best.x + best.y + best.z
        };
      }
    }
    
    return { error: true, message: `Não foi possível encontrar uma distribuição de mesas para ${N} jogadores.` };
  }

  // 3. Tab Navigation Handler
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle nav buttons active state
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding section
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');

      // Trigger redraw of charts on tab display changes to fix potential size issues
      Object.keys(charts).forEach(key => charts[key].resize());
    });
  });

  // Helper to safely format percentages
  const percentStr = (val, total) => total > 0 ? `${Math.round((val / total) * 100)}%` : '0%';

  // 4. Initialize ChartJS graphs
  function initCharts() {
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: colors.textColor, font: { family: 'Outfit', size: 11 } }
        },
        tooltip: tooltipPercentageCallback
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.textColor, font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.textColor, font: { family: 'Inter', size: 10 } }
        }
      }
    };

    // States Chart (Bar Chart)
    charts.states = new Chart(document.getElementById('chart-states'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Jogadores', data: [], backgroundColor: colors.indigo, borderColor: colors.indigoSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Age Chart (Doughnut)
    charts.age = new Chart(document.getElementById('chart-age'), {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: colors.backgrounds, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          legend: { labels: { color: colors.textColor, font: { family: 'Outfit', size: 11 } } },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Experience Chart (Bar Chart)
    charts.experience = new Chart(document.getElementById('chart-experience'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Jogadores', data: [], backgroundColor: colors.teal, borderColor: colors.tealSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Games Played in Last Year Chart (Bar)
    charts.gamesYear = new Chart(document.getElementById('chart-games-year'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Jogadores', data: [], backgroundColor: colors.blue, borderColor: colors.blueSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Play Method Chart (Horizontal Bar)
    charts.playMethod = new Chart(document.getElementById('chart-play-method'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Respostas', data: [], backgroundColor: colors.purple, borderColor: colors.purpleSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Favorite Player Count (Doughnut)
    charts.playerCount = new Chart(document.getElementById('chart-player-count'), {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: colors.backgrounds, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          legend: { labels: { color: colors.textColor, font: { family: 'Outfit', size: 11 } } },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Average Duration (Bar Chart)
    charts.duration = new Chart(document.getElementById('chart-duration'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Jogadores', data: [], backgroundColor: colors.amber, borderColor: colors.amberSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Difficulty Chart (Horizontal Bar)
    charts.difficulty = new Chart(document.getElementById('chart-difficulty'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Jogadores', data: [], backgroundColor: colors.crimson, borderColor: colors.crimsonSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Championship Games count (Bar Chart)
    charts.championshipGames = new Chart(document.getElementById('chart-championship-games'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Respostas', data: [], backgroundColor: colors.teal, borderColor: colors.tealSolid, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        plugins: {
          legend: { display: false },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Expansions Preference Chart (Doughnut)
    charts.expansionsPref = new Chart(document.getElementById('chart-expansions-pref'), {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: colors.backgrounds, borderWidth: 1 }] },
      options: {
        ...chartDefaults,
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          legend: { labels: { color: colors.textColor, font: { family: 'Outfit', size: 11 } } },
          tooltip: tooltipPercentageCallback
        }
      }
    });

    // Faction vs Experience Correlation Chart (Horizontal Stacked Bar)
    charts.factionExperience = new Chart(document.getElementById('chart-faction-experience'), {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: true,
            labels: { color: colors.textColor, font: { family: 'Outfit', size: 11 } }
          },
          tooltip: tooltipPercentageCallback
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 10 } }
          },
          y: {
            stacked: true,
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });
  }

  // Helper: Aggregate counts from a dataset for a single key
  function getCounts(data, key) {
    const counts = {};
    data.forEach(item => {
      let val = item[key];
      if (val === undefined || val === null || val === '') val = 'Não especificado';
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  }

  // Helper: Aggregate split values (comma-separated, e.g. multi-select checkbox responses)
  function getMultiCounts(data, key) {
    const counts = {};
    data.forEach(item => {
      const val = item[key];
      if (!val) return;
      const parts = val.split(',').map(p => p.trim());
      parts.forEach(part => {
        if (!part) return;
        counts[part] = (counts[part] || 0) + 1;
      });
    });
    return counts;
  }

  // Helper: Populate standard list inside UI
  function renderList(container, countsObj, limit = 5, highlightClass = 'indigo') {
    const sorted = Object.entries(countsObj).sort((a, b) => b[1] - a[1]);
    container.innerHTML = '';
    
    if (sorted.length === 0) {
      container.innerHTML = '<div class="info-row"><span class="info-label">Nenhum dado</span></div>';
      return;
    }

    const totalVotes = sorted.reduce((sum, el) => sum + el[1], 0);

    sorted.slice(0, limit).forEach(([label, count]) => {
      const row = document.createElement('div');
      row.className = 'info-row';
      row.innerHTML = `
        <span class="info-label">${label}</span>
        <span class="pill ${highlightClass}">${count} (${Math.round((count / totalVotes) * 100)}%)</span>
      `;
      container.appendChild(row);
    });
  }

  // 5. Main Dashboard Update Function
  function updateDashboard() {
    // A. Apply Filtering Logic
    const filteredData = PLAYER_DATA.filter(player => {
      // 1. Interest Filter
      const interest = els.filterInterest.value;
      if (interest !== 'ALL') {
        if (interest === 'Sim/Talvez') {
          if (player.championship_interest !== 'Sim' && player.championship_interest !== 'Talvez') return false;
        } else {
          if (player.championship_interest !== interest) return false;
        }
      }

      // 2. State Filter
      const state = els.filterState.value;
      if (state !== 'ALL') {
        if (state === 'OTHER') {
          const mainStates = ['SP', 'RJ', 'MG', 'RS', 'PR', 'DF', 'SC', 'PE'];
          if (mainStates.includes(player.state)) return false;
        } else {
          if (player.state !== state) return false;
        }
      }

      // 3. Experience Filter
      const exp = els.filterExperience.value;
      if (exp !== 'ALL' && player.experience !== exp) return false;

      // 4. Play Style Filter
      const style = els.filterStyle.value;
      if (style !== 'ALL' && player.play_style !== style) return false;

      // 5. Expansions Filter
      const expa = els.filterExpansions.value;
      if (expa !== 'ALL') {
        if (expa === 'base') {
          if (player.expansions !== 'Jogo base apenas') return false;
        } else if (expa === 'pok') {
          if (!player.expansions.includes('Profecia dos Reis')) return false;
        } else if (expa === 'thunder') {
          if (!player.expansions.includes("Thunder's Edge")) return false;
        }
      }

      return true;
    });

    const totalLength = PLAYER_DATA.length;
    const filteredLength = filteredData.length;

    // B. Update Filter Indicators
    els.filteredCount.textContent = filteredLength;
    els.totalCount.textContent = totalLength;
    els.filteredPercent.textContent = Math.round((filteredLength / totalLength) * 100) || 0;

    // C. Calculate KPIs
    const totalRespondentsVal = filteredLength;
    const confirmedVal = filteredData.filter(p => p.championship_interest === 'Sim').length;
    const potentialVal = filteredData.filter(p => p.championship_interest === 'Sim' || p.championship_interest === 'Talvez').length;
    
    // Expansion Pok count and Thunder's Edge count
    const pokCount = filteredData.filter(p => p.expansions.includes('Profecia dos Reis')).length;
    const teCount = filteredData.filter(p => p.expansions.includes("Thunder's Edge")).length;
    const pokPct = totalRespondentsVal > 0 ? Math.round((pokCount / totalRespondentsVal) * 100) : 0;
    const tePct = totalRespondentsVal > 0 ? Math.round((teCount / totalRespondentsVal) * 100) : 0;

    els.kpiTotalRespondents.textContent = totalRespondentsVal;
    els.kpiConfirmedPlayers.textContent = confirmedVal;
    els.kpiPotentialPlayers.textContent = potentialVal;
    els.kpiExpansionsSummary.textContent = `PoK: ${pokPct}% (${pokCount}) | TE: ${tePct}% (${teCount})`;

    // Update Planner panel header summary
    els.plannerActiveCount.textContent = potentialVal;
    if (potentialVal >= 5) {
      const useOptimized = els.plannerAlgorithm.value === 'optimized';
      const layout = solveTableDistribution(potentialVal, useOptimized);
      let desc = [];
      if (layout.error) {
        els.plannerTablesCalc.textContent = "Erro ao planejar";
      } else if (useOptimized) {
        if (layout.x > 0) desc.push(`${layout.x} ${layout.x === 1 ? 'mesa' : 'mesas'} de 6`);
        if (layout.y > 0) desc.push(`${layout.y} ${layout.y === 1 ? 'mesa' : 'mesas'} de 5`);
        if (layout.z > 0) desc.push(`${layout.z} ${layout.z === 1 ? 'mesa' : 'mesas'} de 7`);
        
        let text = desc.join(' + ');
        if (layout.ghosts > 0) {
          text += ` (inclui ${layout.ghosts} ${layout.ghosts === 1 ? 'convidado virtual' : 'convidados virtuais'} para fechar)`;
        }
        if (layout.warnNoExact) {
          text += ` *[Ajustado com convidados por sobras]`;
        }
        els.plannerTablesCalc.textContent = text;
      } else {
        const numTables = Math.ceil(potentialVal / 6);
        els.plannerTablesCalc.textContent = `${numTables} mesas divididas igualmente (~6 jog.)`;
      }
    } else {
      els.plannerTablesCalc.textContent = `${potentialVal} jogadores (mínimo de 5 para iniciar)`;
    }

    // D. Aggregate & Draw Chart Data

    // 1. States Chart
    const stateCounts = getCounts(filteredData, 'state');
    const sortedStates = Object.entries(stateCounts).sort((a,b) => b[1] - a[1]);
    charts.states.data.labels = sortedStates.map(el => el[0]);
    charts.states.data.datasets[0].data = sortedStates.map(el => el[1]);
    charts.states.update();

    // 2. Age Chart (Sorted Chronologically)
    const ageCounts = getCounts(filteredData, 'age');
    const ageOrder = ['18-24', '25-34', '35-44', '45+'];
    charts.age.data.labels = ageOrder.filter(k => ageCounts[k] !== undefined);
    charts.age.data.datasets[0].data = charts.age.data.labels.map(k => ageCounts[k] || 0);
    charts.age.update();

    // 3. Experience Chart
    const expCounts = getCounts(filteredData, 'experience');
    // Enforce logical sorting order for experience
    const expOrder = ['Menos de 1 ano', 'Entre 1 a 3 anos', 'Entre 4 e 6 anos', 'Mais de 6 anos'];
    charts.experience.data.labels = expOrder.filter(k => expCounts[k] !== undefined);
    charts.experience.data.datasets[0].data = charts.experience.data.labels.map(k => expCounts[k]);
    charts.experience.update();

    // 4. Games Played in Last Year
    const gameCounts = getCounts(filteredData, 'games_last_year');
    const gamesOrder = ['1 a 3', '4 a 10', '11 a 25', 'Mais de 25'];
    const actualGamesOrder = gamesOrder.filter(k => gameCounts[k] !== undefined).concat(
      Object.keys(gameCounts).filter(k => !gamesOrder.includes(k))
    );
    charts.gamesYear.data.labels = actualGamesOrder;
    charts.gamesYear.data.datasets[0].data = actualGamesOrder.map(k => gameCounts[k] || 0);
    charts.gamesYear.update();

    // 5. Play Methods Chart (Split multi choice)
    const playMethodCounts = getMultiCounts(filteredData, 'play_method');
    const sortedMethods = Object.entries(playMethodCounts).sort((a,b) => b[1] - a[1]);
    charts.playMethod.data.labels = sortedMethods.map(el => el[0]);
    charts.playMethod.data.datasets[0].data = sortedMethods.map(el => el[1]);
    charts.playMethod.update();

    // 6. Favorite Player Count (Sorted Semantically)
    const countCounts = getCounts(filteredData, 'favorite_player_count');
    const countOrder = ['4', '5', '6', '7', '8'];
    charts.playerCount.data.labels = countOrder.filter(k => countCounts[k] !== undefined).map(k => `${k} jogadores`);
    charts.playerCount.data.datasets[0].data = countOrder.filter(k => countCounts[k] !== undefined).map(k => countCounts[k] || 0);
    charts.playerCount.update();

    // 7. Match Duration Chart
    const durationCounts = getCounts(filteredData, 'avg_duration');
    const durationOrder = ['Menos de 6h', '6h a 7h', '7h a 8h', '8h a 9h', 'Mais de 9h', 'Não jogo partidas ao vivo'];
    const actualDurationOrder = durationOrder.filter(k => durationCounts[k] !== undefined).concat(
      Object.keys(durationCounts).filter(k => !durationOrder.includes(k))
    );
    charts.duration.data.labels = actualDurationOrder;
    charts.duration.data.datasets[0].data = actualDurationOrder.map(k => durationCounts[k] || 0);
    charts.duration.update();

    // 8. Difficulty Chart (Split Multi)
    const difficultyCounts = getMultiCounts(filteredData, 'biggest_difficulty');
    const sortedDifficulties = Object.entries(difficultyCounts).sort((a,b) => b[1] - a[1]);
    charts.difficulty.data.labels = sortedDifficulties.map(el => el[0]);
    charts.difficulty.data.datasets[0].data = sortedDifficulties.map(el => el[1]);
    charts.difficulty.update();

    // 9. Championship Games Count Chart (Sorted Semantically)
    const champGamesCounts = getCounts(filteredData, 'championship_games_count');
    const champGamesOrder = ['Ao menos 1', 'Ao menos 2', 'Quantas eu quiser/conseguir'];
    charts.championshipGames.data.labels = champGamesOrder.filter(k => champGamesCounts[k] !== undefined);
    charts.championshipGames.data.datasets[0].data = charts.championshipGames.data.labels.map(k => champGamesCounts[k] || 0);
    charts.championshipGames.update();

    // 9.5. Expansions Chart (Sorted Semantically)
    const expPrefCounts = {
      'Apenas Jogo Base': filteredData.filter(p => p.expansions === 'Jogo base apenas').length,
      'Jogo Base + PoK': filteredData.filter(p => p.expansions === 'Jogo base + Profecia dos Reis').length,
      'PoK + Thunder\'s Edge': filteredData.filter(p => p.expansions.includes("Thunder's Edge")).length
    };
    const expPrefOrder = ['Apenas Jogo Base', 'Jogo Base + PoK', 'PoK + Thunder\'s Edge'];
    charts.expansionsPref.data.labels = expPrefOrder;
    charts.expansionsPref.data.datasets[0].data = expPrefOrder.map(k => expPrefCounts[k] || 0);
    charts.expansionsPref.update();

    // 9.6. Faction vs Experience Correlation Chart (Fixed Grouped Stacked Bar)
    const expTiers = ['Menos de 1 ano', 'Entre 1 a 3 anos', 'Entre 4 e 6 anos', 'Mais de 6 anos'];
    const totalFavCounts = getMultiCounts(filteredData, 'favorite_factions');
    const sortedFactionNames = [...ALL_FACTIONS].sort((a, b) => (totalFavCounts[b] || 0) - (totalFavCounts[a] || 0));

    const datasets = expTiers.map((tier, idx) => {
      const tierPlayers = filteredData.filter(p => p.experience === tier);
      const tierCounts = getMultiCounts(tierPlayers, 'favorite_factions');
      const data = sortedFactionNames.map(f => tierCounts[f] || 0);
      const tierColors = [
        'rgba(99, 102, 241, 0.75)',  // Indigo
        'rgba(20, 184, 166, 0.75)',  // Teal
        'rgba(59, 130, 246, 0.75)',  // Blue
        'rgba(245, 158, 11, 0.75)'   // Amber
      ];
      return {
        label: tier,
        data: data,
        backgroundColor: tierColors[idx],
        borderWidth: 0
      };
    });

    charts.factionExperience.data.labels = sortedFactionNames;
    charts.factionExperience.data.datasets = datasets;
    charts.factionExperience.update();

    // E. Populate Lists & Tables

    // Com quem joga
    const partnersCounts = getCounts(filteredData, 'play_partners');
    renderList(els.listPlayPartners, partnersCounts, 4, 'indigo');

    // Meta de pontos
    const pointsCounts = getCounts(filteredData, 'points_goal');
    renderList(els.listPointsGoal, pointsCounts, 3, 'teal');

    // Como decide mapa/facções
    const setupCounts = getCounts(filteredData, 'setup_decisions');
    renderList(els.listSetupPreferences, setupCounts, 4, 'amber');

    // Factions Favorite vs Unpopular lists
    const favFactionCounts = getMultiCounts(filteredData, 'favorite_factions');
    const leastFactionCounts = getMultiCounts(filteredData, 'least_favorite_factions');

    renderFactionRankList(els.listFactionsFavorites, favFactionCounts, true);
    renderFactionRankList(els.listFactionsUnpopular, leastFactionCounts, false);

    // Heatmap Render
    renderAvailabilityHeatmap(filteredData);

    // Suggestions List
    renderSuggestionsList(filteredData);

    // Contacts lists
    renderContactsLists(filteredData);

    // E. Generate Text Insights & Correlations
    generateDynamicInsights(filteredData, totalRespondentsVal);
  }

  // Factions Rank List Builder (Render ALL 29 Factions)
  function renderFactionRankList(container, counts, isFavorite) {
    const fullCounts = {};
    ALL_FACTIONS.forEach(f => {
      fullCounts[f] = counts[f] || 0;
    });

    const sorted = Object.entries(fullCounts).sort((a, b) => b[1] - a[1]);
    container.innerHTML = '';

    const maxVotes = sorted[0] ? sorted[0][1] : 0;

    sorted.forEach(([factionName, voteCount], index) => {
      const percentageOfMax = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
      const barClass = isFavorite ? 'fav' : 'least';

      const item = document.createElement('div');
      item.className = 'faction-rank-item';
      item.innerHTML = `
        <div class="faction-name-wrap">
          <span class="faction-rank-num">${index + 1}</span>
          <span class="faction-name">${factionName}</span>
        </div>
        <div class="faction-count-bar-wrap">
          <div class="faction-count-bar ${barClass}" style="width: ${percentageOfMax}%"></div>
        </div>
        <span class="faction-votes">${voteCount} ${voteCount === 1 ? 'voto' : 'votos'}</span>
      `;
      container.appendChild(item);
    });
  }

  // Availability Heatmap Builder
  function renderAvailabilityHeatmap(data) {
    const heatmap = els.availabilityHeatmap;
    
    // We define our 3x4 grid structure
    // Days
    const days = [
      { id: 'semana', label: 'Durante a semana', patterns: ['Durante a semana', 'semana'] },
      { id: 'sexta', label: 'Sexta-feira', patterns: ['Sexta-feira', 'sexta'] },
      { id: 'fds', label: 'Fins de semana', patterns: ['Fins de semana', 'fim de semana'] }
    ];

    // Times
    const times = [
      { id: 'manha', label: 'Manhã', patterns: ['manhã', 'manha'] },
      { id: 'tarde', label: 'Tarde', patterns: ['tarde'] },
      { id: 'noite', label: 'Noite', patterns: ['noite'] },
      { id: 'madrugada', label: 'Noite/Madrugada', patterns: ['madrugada', 'noite/madrugada'] }
    ];

    // Initialize counts matrix
    const grid = {};
    days.forEach(d => {
      grid[d.id] = {};
      times.forEach(t => {
        grid[d.id][t.id] = 0;
      });
    });

    // Populate matrix by parsing responses using exact regex matches
    const regex = /(Durante a semana|Sexta-feira|Fins de semana),\s*começando de\s*(manhã|tarde|noite\/madrugada|noite)/gi;
    data.forEach(player => {
      const availText = player.availability || '';
      if (!availText) return;

      const matches = [...availText.matchAll(regex)];
      matches.forEach(m => {
        const dayStr = m[1].toLowerCase();
        const timeStr = m[2].toLowerCase();
        
        let dayId = null;
        if (dayStr === 'durante a semana') dayId = 'semana';
        else if (dayStr === 'sexta-feira') dayId = 'sexta';
        else if (dayStr === 'fins de semana') dayId = 'fds';

        let timeId = null;
        if (timeStr === 'manhã' || timeStr === 'manha') timeId = 'manha';
        else if (timeStr === 'tarde') timeId = 'tarde';
        else if (timeStr === 'noite') timeId = 'noite';
        else if (timeStr === 'noite/madrugada' || timeStr === 'madrugada') timeId = 'madrugada';

        if (dayId && timeId) {
          grid[dayId][timeId]++;
        }
      });
    });

    // Render HTML
    heatmap.innerHTML = '';

    // Render Header labels (Days)
    // First cell is empty corner spacer
    const corner = document.createElement('div');
    corner.className = 'heatmap-day';
    heatmap.appendChild(corner);

    days.forEach(d => {
      const headerCell = document.createElement('div');
      headerCell.className = 'heatmap-day';
      headerCell.textContent = d.label;
      heatmap.appendChild(headerCell);
    });

    // Find max value in grid to scale brightness
    let maxCount = 0;
    days.forEach(d => {
      times.forEach(t => {
        if (grid[d.id][t.id] > maxCount) maxCount = grid[d.id][t.id];
      });
    });

    // Render Rows (Time slots)
    times.forEach(t => {
      // Row Label
      const rowLabel = document.createElement('div');
      rowLabel.className = 'heatmap-day';
      rowLabel.style.display = 'flex';
      rowLabel.style.alignItems = 'center';
      rowLabel.style.justifyContent = 'flex-start';
      rowLabel.style.fontSize = '0.75rem';
      rowLabel.textContent = t.label;
      heatmap.appendChild(rowLabel);

      // Day cells
      days.forEach(d => {
        const count = grid[d.id][t.id];
        const opacity = maxCount > 0 ? (count / maxCount) * 0.7 + 0.05 : 0.02;
        const color = `rgba(99, 102, 241, ${opacity})`;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.style.backgroundColor = color;
        cell.style.borderColor = count > 0 ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.05)';
        
        cell.innerHTML = `
          <span class="heatmap-cell-val" style="color: ${count > 0 ? '#fff' : 'var(--text-dim)'}">${count}</span>
        `;
        
        cell.title = `${count} jogadores disponíveis em ${d.label} (${t.label})`;
        heatmap.appendChild(cell);
      });
    });
  }

  // Render Suggestions List
  function renderSuggestionsList(data) {
    const list = els.suggestionsList;
    list.innerHTML = '';

    const suggestions = data.filter(p => p.suggestions && p.suggestions.trim().length > 3);

    if (suggestions.length === 0) {
      list.innerHTML = '<div class="empty-state"><span class="empty-state-icon">💭</span><p>Nenhuma sugestão nos registros correspondentes a este filtro.</p></div>';
      return;
    }

    suggestions.forEach(p => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      
      const expPill = `<span class="pill indigo">${p.experience || 'Sem exp'}</span>`;
      const interestPill = `<span class="pill teal">${p.championship_interest || 'Sem interesse'}</span>`;

      item.innerHTML = `
        <div class="suggestion-header">
          <span>${p.name || 'Jogador Anônimo'} (${p.state || 'UF não informada'})</span>
          <div style="display: flex; gap: 0.5rem;">
            ${expPill}
            ${interestPill}
          </div>
        </div>
        <div class="suggestion-text">"${p.suggestions}"</div>
      `;
      list.appendChild(item);
    });
  }

  // Render Contacts Lists
  function renderContactsLists(data) {
    const waList = els.listWhatsappContacts;
    const emailList = els.listEmailContacts;

    waList.innerHTML = '';
    emailList.innerHTML = '';

    const waContacts = data.filter(p => p.whatsapp && String(p.whatsapp).trim().length > 3);
    const emailContacts = data.filter(p => p.email && String(p.email).trim().length > 3);

    if (waContacts.length === 0) {
      waList.innerHTML = '<div class="empty-state"><p>Nenhum voluntário do WhatsApp com os filtros atuais.</p></div>';
    } else {
      waContacts.forEach(p => {
        const item = document.createElement('div');
        item.className = 'info-row';
        item.innerHTML = `
          <span class="info-label" style="font-weight: 500;">${p.name || 'Jogador'} (${p.state})</span>
          <span class="pill teal" style="font-family: monospace; font-size: 0.85rem;">${p.whatsapp}</span>
        `;
        waList.appendChild(item);
      });
    }

    if (emailContacts.length === 0) {
      emailList.innerHTML = '<div class="empty-state"><p>Nenhum contato de e-mail com os filtros atuais.</p></div>';
    } else {
      emailContacts.forEach(p => {
        const item = document.createElement('div');
        item.className = 'info-row';
        item.innerHTML = `
          <span class="info-label" style="font-weight: 500;">${p.name || 'Jogador'} (${p.state})</span>
          <span class="pill indigo" style="font-size: 0.8rem;">${p.email}</span>
        `;
        emailList.appendChild(item);
      });
    }
  }

  // Generate correlations and text insights
  function generateDynamicInsights(data, total) {
    if (total === 0) {
      els.insightGeography.textContent = "Sem dados correspondentes aos filtros atuais.";
      els.insightExperience.textContent = "Sem dados correspondentes aos filtros atuais.";
      els.insightFrequency.textContent = "Sem dados correspondentes aos filtros atuais.";
      return;
    }

    // 1. Geographic Insight
    const stateCounts = getCounts(data, 'state');
    const sortedStates = Object.entries(stateCounts).sort((a,b) => b[1] - a[1]);
    const topState = sortedStates[0] ? sortedStates[0][0] : 'N/A';
    const topStateCount = sortedStates[0] ? sortedStates[0][1] : 0;
    const topStatePercent = Math.round((topStateCount / total) * 100);
    els.insightGeography.textContent = `Concentração geográfica principal em ${topState} com ${topStatePercent}% dos jogadores ativos (${topStateCount} de ${total}).`;

    // 2. Experience vs Expansions correlation
    const veterans = data.filter(p => p.experience === 'Mais de 6 anos' || p.experience === 'Entre 4 e 6 anos');
    const vetsTotal = veterans.length;
    const vetsPok = veterans.filter(p => p.expansions.includes('Profecia dos Reis')).length;
    const vetsPokPercent = vetsTotal > 0 ? Math.round((vetsPok / vetsTotal) * 100) : 0;

    const beginners = data.filter(p => p.experience === 'Menos de 1 ano');
    const begsTotal = beginners.length;
    const begsPok = beginners.filter(p => p.expansions.includes('Profecia dos Reis')).length;
    const begsPokPercent = begsTotal > 0 ? Math.round((begsPok / begsTotal) * 100) : 0;

    els.insightExperience.textContent = `${vetsPokPercent}% dos veteranos (${vetsTotal} jogadores com 4+ anos de TI) jogam com a expansão PoK, enquanto ${begsPokPercent}% dos iniciantes (${begsTotal} jogadores com < 1 ano) já a incorporaram.`;

    // 3. Play frequency analysis
    const heavyPlayers = data.filter(p => p.games_last_year === 'Mais de 10' || p.games_last_year === '7 a 10').length;
    const heavyPercent = Math.round((heavyPlayers / total) * 100);
    els.insightFrequency.textContent = `${heavyPercent}% da base ativa jogou 7 ou mais partidas no último ano (${heavyPlayers} jogadores), sinalizando que a comunidade tem alto ritmo e prontidão para torneios competitivos.`;
  }

  // 6. Tournament Table Generator Engine
  function generateTournamentTables() {
    // Sift active players who are interested in the tournament (Sim or Talvez)
    const activePlayers = PLAYER_DATA.filter(player => {
      // 1. First enforce current filters, but ensure we only count tournament prospects (Sim + Talvez)
      const interest = player.championship_interest;
      if (interest !== 'Sim' && interest !== 'Talvez') return false;

      // Enforce the other filters if they are set (e.g. State, Experience)
      const state = els.filterState.value;
      if (state !== 'ALL') {
        if (state === 'OTHER') {
          const mainStates = ['SP', 'RJ', 'MG', 'RS', 'PR', 'DF', 'SC', 'PE'];
          if (mainStates.includes(player.state)) return false;
        } else {
          if (player.state !== state) return false;
        }
      }

      const exp = els.filterExperience.value;
      if (exp !== 'ALL' && player.experience !== exp) return false;

      const style = els.filterStyle.value;
      if (style !== 'ALL' && player.play_style !== style) return false;

      return true;
    });

    const container = els.plannerTablesContainer;
    container.innerHTML = '';

    if (activePlayers.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Nenhum jogador disponível. Tente remover os filtros de Estado ou Experiência na barra lateral.</p></div>';
      return;
    }

    // Sort players based on seeding criteria
    const criteria = els.plannerSort.value;
    let seededPlayers = [...activePlayers];

    if (criteria === 'experience') {
      // Sort: Beginners -> Intermediate -> Advanced -> Veterans, to distribute them evenly
      const expWeights = {
        'Menos de 1 ano': 1,
        'Entre 1 a 3 anos': 2,
        'Entre 4 e 6 anos': 3,
        'Mais de 6 anos': 4
      };
      seededPlayers.sort((a, b) => (expWeights[a.experience] || 0) - (expWeights[b.experience] || 0));
    } else if (criteria === 'state') {
      // Sort by state to try to group different states together
      seededPlayers.sort((a, b) => (a.state || '').localeCompare(b.state || ''));
    } else {
      // Random Shuffle
      seededPlayers.sort(() => Math.random() - 0.5);
    }

    // Seeding and grouping algorithm
    const algorithm = els.plannerAlgorithm.value;
    const numPlayers = seededPlayers.length;
    const tableTemplates = [];

    if (algorithm === 'optimized') {
      const layout = solveTableDistribution(numPlayers, true); // Otimizador (with fallback)
      if (layout.error) {
        container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>${layout.message}</p></div>`;
        return;
      }

      // Add ghosts to seededPlayers
      for (let g = 0; g < layout.ghosts; g++) {
        seededPlayers.push({
          name: `Convidado Virtual ${g + 1}`,
          state: 'N/A',
          experience: 'N/A',
          championship_interest: 'Virtual'
        });
      }

      for (let i = 0; i < layout.x; i++) tableTemplates.push({ id: `Mesa ${tableTemplates.length + 1} (6 Jog.)`, target: 6, players: [] });
      for (let i = 0; i < layout.y; i++) tableTemplates.push({ id: `Mesa ${tableTemplates.length + 1} (5 Jog.)`, target: 5, players: [] });
      for (let i = 0; i < layout.z; i++) tableTemplates.push({ id: `Mesa ${tableTemplates.length + 1} (7 Jog.)`, target: 7, players: [] });

      // Distribute round-robin to tables that are not full
      let currentTableIdx = 0;
      seededPlayers.forEach(player => {
        let attempts = 0;
        while (tableTemplates[currentTableIdx].players.length >= tableTemplates[currentTableIdx].target && attempts < tableTemplates.length) {
          currentTableIdx = (currentTableIdx + 1) % tableTemplates.length;
          attempts++;
        }
        tableTemplates[currentTableIdx].players.push(player);
        currentTableIdx = (currentTableIdx + 1) % tableTemplates.length;
      });
    } else {
      // Simple division: Divisão Igualitária (Original)
      const numTables = Math.ceil(numPlayers / 6);
      if (numTables === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum jogador disponível.</p></div>';
        return;
      }

      // Equalize table sizes dynamically
      const baseSize = Math.floor(numPlayers / numTables);
      const extraPlayers = numPlayers % numTables;

      for (let i = 0; i < numTables; i++) {
        const target = baseSize + (i < extraPlayers ? 1 : 0);
        tableTemplates.push({ id: `Mesa ${i + 1} (${target} Jog.)`, target: target, players: [] });
      }

      // Round-robin distribution
      seededPlayers.forEach((player, index) => {
        const tableIndex = index % numTables;
        tableTemplates[tableIndex].players.push(player);
      });
    }

    // Render tables to UI
    tableTemplates.forEach((table, tIdx) => {
      const card = document.createElement('div');
      card.className = 'planner-table-card';
      
      const numOnTable = table.players.length;
      const badgeText = `${numOnTable}/${table.target} Jog.`;

      card.innerHTML = `
        <div class="planner-table-header">
          <span>${table.id.toUpperCase()}</span>
          <span class="planner-table-badge">${badgeText}</span>
        </div>
        <div class="planner-player-list">
          ${table.players.map(p => {
            const isGhost = p.championship_interest === 'Virtual';
            const itemClass = isGhost ? 'no-border' : (p.championship_interest === 'Talvez' ? 'no-border' : '');
            const metaText = isGhost ? 'Convidado Virtual' : `${p.state || 'UF'} | ${p.experience === 'Mais de 6 anos' || p.experience === 'Entre 4 e 6 anos' ? 'Vet' : 'Inic'} (${p.championship_interest})`;
            
            return `
              <div class="planner-player-item ${itemClass}" style="${isGhost ? 'border-left: 2px dashed var(--text-dim); opacity: 0.65;' : ''}">
                <span class="planner-player-name">${p.name || 'Jogador Anônimo'}</span>
                <span class="planner-player-meta">${metaText}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 7. Event Listeners Setup
  // Wire up filter controls
  els.filterInterest.addEventListener('change', updateDashboard);
  els.filterState.addEventListener('change', updateDashboard);
  els.filterExperience.addEventListener('change', updateDashboard);
  els.filterStyle.addEventListener('change', updateDashboard);
  els.filterExpansions.addEventListener('change', updateDashboard);

  // Reset Filters Button
  els.btnResetFilters.addEventListener('click', () => {
    els.filterInterest.value = 'ALL';
    els.filterState.value = 'ALL';
    els.filterExperience.value = 'ALL';
    els.filterStyle.value = 'ALL';
    els.filterExpansions.value = 'ALL';
    updateDashboard();
  });

  // Table Generator Button & Algorithm toggler
  els.btnGenerateTables.addEventListener('click', generateTournamentTables);
  els.plannerAlgorithm.addEventListener('change', () => {
    updateDashboard();
    generateTournamentTables();
  });

  // --- EDITOR DE SLICES (MILTY DRAFT) CODE ---
  
  // Slices state variables
  let slicesData = []; // Array of { name: 'A', tiles: ['65', '29', '68', '25', '41'] }
  let selectedTile = null; // { sliceIndex: number, tileIndex: number }

  const slicesEls = {
    container: document.getElementById('slices-container'),
    stringInput: document.getElementById('slices-string-input'),
    btnImport: document.getElementById('slices-btn-import'),
    btnExport: document.getElementById('slices-btn-export'),
    btnAdd: document.getElementById('slices-btn-add'),
    btnClear: document.getElementById('slices-btn-clear'),
    editorPanel: document.getElementById('slices-editor-panel'),
    editorEmpty: document.getElementById('slices-editor-empty'),
    editorContent: document.getElementById('slices-editor-content'),
    editSliceName: document.getElementById('slices-edit-slice-name'),
    editPositionName: document.getElementById('slices-edit-position-name'),
    sysSearch: document.getElementById('slices-sys-search'),
    searchResults: document.getElementById('slices-search-results')
  };

  const slicePositions = [
    { label: 'Esquerda (LA)', index: 0, top: 130, left: 0 },
    { label: 'Esquerda-Frente (LF)', index: 1, top: 65, left: 37.5 },
    { label: 'Centro/Frente (C)', index: 2, top: 0, left: 75 },
    { label: 'Direita-Frente (RF)', index: 3, top: 65, left: 112.5 },
    { label: 'Direita (RA)', index: 4, top: 130, left: 150 }
  ];

  // Helper to calculate slice metrics
  function calculateSliceMetrics(tiles) {
    let totalRes = 0;
    let totalInf = 0;
    let optimalRes = 0;
    let optimalInf = 0;
    let optimalFlex = 0;
    let skips = [];
    let hasLegendary = false;
    let wormholes = new Set();

    tiles.forEach(id => {
      const sys = TI4_SYSTEMS[id];
      if (!sys) return;

      sys.wormholes.forEach(w => wormholes.add(w));

      sys.planets.forEach(p => {
        totalRes += p.resources;
        totalInf += p.influence;

        if (p.resources > p.influence) {
          optimalRes += p.resources;
        } else if (p.influence > p.resources) {
          optimalInf += p.influence;
        } else {
          optimalFlex += p.resources;
        }

        if (p.tech) {
          skips.push(p.tech);
        }
        if (p.legendary) {
          hasLegendary = true;
        }
      });
    });

    return {
      totalRes,
      totalInf,
      optimalRes,
      optimalInf,
      optimalFlex,
      optimalTotal: optimalRes + optimalInf + optimalFlex,
      skips,
      hasLegendary,
      wormholes: Array.from(wormholes)
    };
  }

  // Load default slices on startup
  function loadDefaultSlices() {
    const defaultString = "65,29,68,25,41|24,30,46,26,67|21,62,37,39,117|111,33,72,113,114|103,107,48,64,42|32,99,35,79,77|108,97,116,102,49|23,36,75,40,80";
    slicesEls.stringInput.value = defaultString;
    importSlicesFromString(defaultString);
  }

  // Parse string and build state
  function importSlicesFromString(str) {
    if (!str.trim()) return;
    
    // Split by | or ;
    const sliceParts = str.split(/[|;]/);
    slicesData = [];

    sliceParts.forEach((part, idx) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      const tileIds = trimmed.split(',').map(s => s.trim());
      // Pad or truncate to 5 tiles
      while (tileIds.length < 5) tileIds.push("46"); // empty system fallback
      if (tileIds.length > 5) tileIds.length = 5;

      const sliceName = String.fromCharCode(65 + idx); // A, B, C, ...
      slicesData.push({
        name: sliceName,
        tiles: tileIds
      });
    });

    selectedTile = null;
    updateEditorPanel();
    renderSlices();
  }

  // Export state to string
  function exportSlicesToString() {
    const str = slicesData.map(s => s.tiles.join(',')).join('|');
    slicesEls.stringInput.value = str;
    slicesEls.stringInput.select();
    
    // Copy to clipboard
    navigator.clipboard.writeText(str).then(() => {
      // Show short alert/visual cue
      const origText = slicesEls.btnExport.textContent;
      slicesEls.btnExport.textContent = "Copiado!";
      slicesEls.btnExport.style.background = "var(--accent-teal)";
      setTimeout(() => {
        slicesEls.btnExport.textContent = origText;
        slicesEls.btnExport.style.background = "";
      }, 1500);
    });
  }

  // Add new blank slice
  function addBlankSlice() {
    const idx = slicesData.length;
    const sliceName = String.fromCharCode(65 + idx);
    slicesData.push({
      name: sliceName,
      tiles: ["46", "46", "46", "46", "46"] // empty systems
    });
    renderSlices();
    
    // Update string input
    slicesEls.stringInput.value = slicesData.map(s => s.tiles.join(',')).join('|');
  }

  // Clear all slices
  function clearAllSlices() {
    slicesData = [];
    selectedTile = null;
    updateEditorPanel();
    renderSlices();
    slicesEls.stringInput.value = "";
  }

  // Update System Editor Panel
  function updateEditorPanel() {
    if (!selectedTile) {
      slicesEls.editorEmpty.style.display = 'block';
      slicesEls.editorContent.style.display = 'none';
      return;
    }

    slicesEls.editorEmpty.style.display = 'none';
    slicesEls.editorContent.style.display = 'flex';

    const slice = slicesData[selectedTile.sliceIndex];
    const pos = slicePositions[selectedTile.tileIndex];
    const currentTileId = slice.tiles[selectedTile.tileIndex];
    const currentSys = TI4_SYSTEMS[currentTileId] || { name: 'Desconhecido', id: currentTileId, back: 'blue', planets: [], wormholes: [] };

    slicesEls.editSliceName.textContent = `Slice ${slice.name}`;
    slicesEls.editPositionName.textContent = pos.label;
    slicesEls.sysSearch.value = "";

    // Render all tiles as search results initially
    renderSearchResults("");
  }

  // Render search results in editor
  function renderSearchResults(query) {
    slicesEls.searchResults.innerHTML = "";
    
    // Convert query to lower case
    const q = query.toLowerCase().trim();

    // Find matching systems from TI4_SYSTEMS
    const results = [];
    Object.keys(TI4_SYSTEMS).forEach(id => {
      const sys = TI4_SYSTEMS[id];
      
      // Match by tile number or name or planet names
      const matchId = id.includes(q);
      const matchName = sys.name.toLowerCase().includes(q);
      let matchPlanet = false;
      sys.planets.forEach(p => {
        if (p.name.toLowerCase().includes(q)) matchPlanet = true;
      });

      if (!q || matchId || matchName || matchPlanet) {
        results.push(sys);
      }
    });

    // Sort results: Blue tiles first, then Red tiles, then Home/Green tiles, then by ID numeric
    results.sort((a, b) => {
      if (a.back !== b.back) {
        if (a.back === 'blue') return -1;
        if (b.back === 'blue') return 1;
        if (a.back === 'red') return -1;
        if (b.back === 'red') return 1;
      }
      return parseInt(a.id) - parseInt(b.id);
    });

    if (results.length === 0) {
      slicesEls.searchResults.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">Nenhum sistema encontrado.</div>`;
      return;
    }

    results.forEach(sys => {
      const item = document.createElement('div');
      item.className = 'slices-editor-result-item';
      
      // Calculate system stats summary
      let resCount = 0;
      let infCount = 0;
      sys.planets.forEach(p => {
        resCount += p.resources;
        infCount += p.influence;
      });

      let badgeClass = sys.back === 'red' ? 'style="color: var(--accent-crimson); font-weight: bold;"' : 'style="color: var(--accent-teal); font-weight: bold;"';
      let backName = sys.back === 'red' ? 'Vermelho' : (sys.back === 'blue' ? 'Azul' : 'Verde');

      let statsSummary = sys.planets.length > 0 ? `${resCount}R, ${infCount}I` : 'Sem Planetas';
      
      // Skips and specials info
      let specials = [];
      sys.planets.forEach(p => {
        if (p.tech) specials.push(p.tech.substring(0,3).toUpperCase());
        if (p.legendary) specials.push('LEG');
      });
      sys.wormholes.forEach(w => specials.push(`WH-${w.toUpperCase()}`));
      const specialsStr = specials.length > 0 ? ` [${specials.join(',')}]` : '';

      item.innerHTML = `
        <div>
          <span ${badgeClass}>[${sys.id}]</span> <strong>${sys.name}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${backName} | ${statsSummary}${specialsStr}</div>
        </div>
        <button class="reset-filters-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-top: 0; background: rgba(99, 102, 241, 0.15); border-color: var(--accent-indigo);">Selecionar</button>
      `;

      item.addEventListener('click', () => {
        if (!selectedTile) return;
        
        // Update state
        slicesData[selectedTile.sliceIndex].tiles[selectedTile.tileIndex] = sys.id;
        
        // Update string textarea
        slicesEls.stringInput.value = slicesData.map(s => s.tiles.join(',')).join('|');

        // Re-render
        renderSlices();
        
        // Highlight active hex
        const activeHex = document.querySelector(`.slice-hex[data-slice="${selectedTile.sliceIndex}"][data-tile="${selectedTile.tileIndex}"]`);
        if (activeHex) activeHex.classList.add('active-hex');
        
        // Update stats card details if search results updated
        updateEditorPanel();
      });

      slicesEls.searchResults.appendChild(item);
    });
  }

  // Render slices container
  function renderSlices() {
    slicesEls.container.innerHTML = "";

    if (slicesData.length === 0) {
      slicesEls.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 8px;">
          Nenhum slice carregado. Use a caixa de importação ao lado ou clique em "+ Adicionar Slice" para começar.
        </div>
      `;
      return;
    }

    slicesData.forEach((slice, sIdx) => {
      const card = document.createElement('div');
      card.className = 'slice-card';

      // Compute stats
      const stats = calculateSliceMetrics(slice.tiles);

      // Skips and specialties
      const skipIcons = stats.skips.map(s => {
        let color = '#fff';
        if (s === 'cybernetic') color = '#3b82f6'; // blue
        if (s === 'biotic') color = '#22c55e'; // green
        if (s === 'propulsion') color = '#a855f7'; // purple
        if (s === 'warfare') color = '#ef4444'; // red
        return `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color}; margin-right:4px;" title="${s}"></span>`;
      }).join('');

      let specialInfo = "";
      if (stats.hasLegendary) specialInfo += "⭐ Lendário ";
      if (stats.wormholes.length > 0) specialInfo += `🌀 WH(${stats.wormholes.join(',').toUpperCase()}) `;

      // Render hexagon sector map
      let hexesHtml = "";
      slicePositions.forEach(pos => {
        const id = slice.tiles[pos.index];
        const sys = TI4_SYSTEMS[id] || { name: 'Empty', id, back: 'red', planets: [], wormholes: [] };
        
        let tileClass = sys.back === 'red' ? 'red-tile' : 'blue-tile';
        
        // Active border if selected
        const isActive = selectedTile && selectedTile.sliceIndex === sIdx && selectedTile.tileIndex === pos.index;
        const activeClass = isActive ? 'active-hex' : '';

        // Planet text inside hex
        let resCount = 0;
        let infCount = 0;
        sys.planets.forEach(p => {
          resCount += p.resources;
          infCount += p.influence;
        });
        const planetText = sys.planets.length > 0 ? `${resCount}/${infCount}` : '';

        // Badges inside hex (skips / legendary / wormhole)
        let hasWh = sys.wormholes.length > 0 ? '🌀' : '';
        let hasLeg = sys.planets.some(p => p.legendary) ? '⭐' : '';
        let hasSk = sys.planets.some(p => p.tech) ? '🧪' : '';
        const badges = `${hasWh}${hasLeg}${hasSk}`;

        hexesHtml += `
          <div class="slice-hex ${tileClass} ${activeClass}" 
               data-slice="${sIdx}" 
               data-tile="${pos.index}"
               style="top: ${pos.top}px; left: ${pos.left}px;"
               title="${pos.label}: ${sys.name} (${sys.id})">
            <span class="slice-hex-number">${sys.id}</span>
            <span class="slice-hex-name">${sys.name}</span>
            ${planetText ? `<span class="slice-hex-planets">${planetText}</span>` : ''}
            ${badges ? `<div class="slice-hex-icons">${badges}</div>` : ''}
          </div>
        `;
      });

      card.innerHTML = `
        <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: var(--accent-teal); margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
          <span>Slice ${slice.name}</span>
          <button class="slices-btn-delete-slice reset-filters-btn" data-slice="${sIdx}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); margin-top: 0; color: var(--accent-crimson);">Excluir</button>
        </div>

        <div class="slice-map-wrapper">
          ${hexesHtml}
        </div>

        <div class="planner-player-list" style="margin-top: 1rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; color: var(--text-muted);">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 700; color: var(--text-main);">
                <th style="padding: 0.35rem 0;">Métrica</th>
                <th style="padding: 0.35rem 0; text-align: right;">Total</th>
                <th style="padding: 0.35rem 0; text-align: right; color: var(--accent-teal);">Ótimo</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.35rem 0;">Recursos</td>
                <td style="padding: 0.35rem 0; text-align: right;">${stats.totalRes}</td>
                <td style="padding: 0.35rem 0; text-align: right; color: var(--accent-teal); font-weight: bold;">${stats.optimalRes}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.35rem 0;">Influência</td>
                <td style="padding: 0.35rem 0; text-align: right;">${stats.totalInf}</td>
                <td style="padding: 0.35rem 0; text-align: right; color: var(--accent-teal); font-weight: bold;">${stats.optimalInf}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.35rem 0;">Flex (Equiv)</td>
                <td style="padding: 0.35rem 0; text-align: right;">-</td>
                <td style="padding: 0.35rem 0; text-align: right; color: var(--accent-teal);">${stats.optimalFlex}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 700; color: var(--text-main);">
                <td style="padding: 0.4rem 0;">Valor da Fatia</td>
                <td style="padding: 0.4rem 0; text-align: right;">${stats.totalRes + stats.totalInf}</td>
                <td style="padding: 0.4rem 0; text-align: right; color: var(--accent-teal); font-size: 0.95rem;">${stats.optimalTotal}</td>
              </tr>
              ${stats.skips.length > 0 ? `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.35rem 0;">Especialidades</td>
                <td colspan="2" style="padding: 0.35rem 0; text-align: right; display: flex; align-items: center; justify-content: flex-end;">
                  ${skipIcons} <span style="font-size: 0.75rem;">(${stats.skips.length} skips)</span>
                </td>
              </tr>` : ''}
              ${specialInfo ? `
              <tr>
                <td style="padding: 0.35rem 0;">Especiais</td>
                <td colspan="2" style="padding: 0.35rem 0; text-align: right; color: var(--accent-amber); font-size: 0.75rem;">
                  ${specialInfo}
                </td>
              </tr>` : ''}
            </tbody>
          </table>
        </div>
      `;

      slicesEls.container.appendChild(card);
    });

    // Wire up hex click events
    document.querySelectorAll('.slice-hex').forEach(hex => {
      hex.addEventListener('click', (e) => {
        const sIdx = parseInt(hex.dataset.slice);
        const tIdx = parseInt(hex.dataset.tile);
        
        // Remove active-hex from all
        document.querySelectorAll('.slice-hex').forEach(h => h.classList.remove('active-hex'));
        
        selectedTile = { sliceIndex: sIdx, tileIndex: tIdx };
        hex.classList.add('active-hex');
        
        updateEditorPanel();
      });
    });

    // Wire up delete slice buttons
    document.querySelectorAll('.slices-btn-delete-slice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sIdx = parseInt(btn.dataset.slice);
        slicesData.splice(sIdx, 1);
        
        // Recalculate slice names
        slicesData.forEach((s, i) => {
          s.name = String.fromCharCode(65 + i);
        });

        selectedTile = null;
        updateEditorPanel();
        renderSlices();

        // Update string input
        slicesEls.stringInput.value = slicesData.map(s => s.tiles.join(',')).join('|');
      });
    });
  }

  // Wire up Slice Editor control listeners
  slicesEls.btnImport.addEventListener('click', () => {
    importSlicesFromString(slicesEls.stringInput.value);
  });

  slicesEls.btnExport.addEventListener('click', () => {
    exportSlicesToString();
  });

  slicesEls.btnAdd.addEventListener('click', () => {
    addBlankSlice();
  });

  slicesEls.btnClear.addEventListener('click', () => {
    if (confirm("Tem certeza que deseja limpar todas as fatias?")) {
      clearAllSlices();
    }
  });

  slicesEls.sysSearch.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  // Load defaults
  loadDefaultSlices();

  // --- END OF EDITOR DE SLICES (MILTY DRAFT) CODE ---

  // 8. Start Application
  initCharts();
  updateDashboard();
  generateTournamentTables(); // Seed planner round 1 immediately
});
