window.Stats = (() => {
  let brandChart = null;
  let monthChart = null;

  function destroyCharts() {
    if (brandChart) {
      brandChart.destroy();
      brandChart = null;
    }
    if (monthChart) {
      monthChart.destroy();
      monthChart = null;
    }
  }

  function render(items) {
    destroyCharts();

    const brandMap = {};
    const monthMap = {};
    const brandSpendMap = {};

    items.forEach(item => {
      const brand = item.brand?.trim() || "未分類";
      const price = Number(item.price || 0);

      brandMap[brand] = (brandMap[brand] || 0) + 1;
      brandSpendMap[brand] = (brandSpendMap[brand] || 0) + price;

      if (item.purchaseDate) {
        const month = item.purchaseDate.slice(0, 7);
        monthMap[month] = (monthMap[month] || 0) + price;
      }
    });

    renderBrandChart(brandMap);
    renderMonthChart(monthMap);
    renderBrandSpendList(brandSpendMap);
  }

  function renderBrandChart(brandMap) {
    const canvas = document.getElementById("brandChart");
    if (!canvas) return;

    const labels = Object.keys(brandMap);
    const data = Object.values(brandMap);

    if (!labels.length) {
      canvas.parentElement.innerHTML = `
        <h4 class="stats-title">各品牌佔比</h4>
        <div class="empty-card"><p>目前沒有品牌統計資料</p></div>
      `;
      return;
    }

    brandChart = new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [{ data }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#f3f4f6" }
          }
        }
      }
    });
  }

  function renderMonthChart(monthMap) {
    const canvas = document.getElementById("monthChart");
    if (!canvas) return;

    const labels = Object.keys(monthMap).sort();
    const data = labels.map(label => monthMap[label]);

    if (!labels.length) {
      canvas.parentElement.innerHTML = `
        <h4 class="stats-title">每月花費</h4>
        <div class="empty-card"><p>目前沒有每月花費資料</p></div>
      `;
      return;
    }

    monthChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "每月花費",
          data
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: { color: "#f3f4f6" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            ticks: { color: "#f3f4f6" },
            grid: { color: "rgba(255,255,255,0.08)" }
          }
        },
        plugins: {
          legend: {
            labels: { color: "#f3f4f6" }
          }
        }
      }
    });
  }

  function renderBrandSpendList(brandSpendMap) {
    const container = document.getElementById("brandSpendList");
    if (!container) return;

    const entries = Object.entries(brandSpendMap).sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
      container.innerHTML = `
        <div class="empty-card"><p>目前沒有各品牌花費資料</p></div>
      `;
      return;
    }

    container.innerHTML = entries.map(([brand, amount]) => `
      <div class="stats-list-item">
        <span class="stats-list-label">${brand}</span>
        <span class="stats-list-value">${UI.formatCurrency(amount)}</span>
      </div>
    `).join("");
  }

  return { render };
})();