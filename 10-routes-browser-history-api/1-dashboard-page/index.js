import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Page {
  static BACKEND_URL = BACKEND_URL;
  element;
  subElements = {};
  components = {};

  getTemplate() {
    return `
    <div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>
      <h3 class="block-title">Best sellers</h3>
      <div data-element="sortableTable">
      </div>
    </div>
`;
  }

  async render() {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    await this.createInstancesOfComponents();

    this.renderComponents();
    this.addEventListeners();

    document.querySelector('.progress-bar').hidden = true;

    return this.element;
  }

  createInstancesOfComponents() {
    const to = new Date();
    const from = new Date(2022, 8, 1, 1, 1, 1, 1);

    this.components.ordersChart = new ColumnChart({
      label: 'orders',
      url: `${Page.BACKEND_URL}api/dashboard/orders`,
      range: {from, to},
    });

    this.components.salesChart = new ColumnChart({
      label: 'sales',
      url: `${Page.BACKEND_URL}api/dashboard/sales`,
      range: {from, to},
      formatHeading: data => `$${data}`
    });

    this.components.customersChart = new ColumnChart({
      label: 'customers',
      url: `${Page.BACKEND_URL}api/dashboard/customers`,
      range: {from, to}
    });

    this.components.rangePicker = new RangePicker({from, to});

    this.components.sortableTable = new SortableTable(header, {
      url: `${Page.BACKEND_URL}api/dashboard/bestsellers?from=${from.toISOString()}&to=${to.toISOString()}`,
      isSortLocally: true,
    });
  }

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');
    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }

    return result;
  }

  renderComponents() {
    Object.keys(this.components).forEach(item => {
      const wrapper = this.subElements[item];
      const component = this.components[item].element;
      wrapper.append(component);
    });
  }

  dateSelectHandler = async (event) => {
    const {from, to} = event.detail;
    await Promise.all([this.updateTable(from, to), this.updateColumnCharts(from, to)]);
  };

  async updateTable(from, to) {
    const data = await fetchJson(`${Page.BACKEND_URL}api/dashboard/bestsellers?from=${from.toISOString()}&to=${to.toISOString()}`);
    this.components.sortableTable.addRows(data);
  }

  async updateColumnCharts(from, to) {
    const salesPr = this.components.salesChart.update(from, to);
    const ordersPr = this.components.ordersChart.update(from, to);
    const customersPr = this.components.customersChart.update(from, to);
    await Promise.all([salesPr, ordersPr, customersPr]);
  }

  addEventListeners() {
    this.components.rangePicker.element.addEventListener('date-select', event => this.dateSelectHandler(event));
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    Object.values(this.components).forEach(item => item.destroy());
  }
}
