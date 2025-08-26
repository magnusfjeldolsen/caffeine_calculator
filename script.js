class CaffeineCalculator {
    constructor() {
        this.intakeCounter = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateChart();
    }

    setupEventListeners() {
        // Metabolism rate change
        const metabolismRate = document.getElementById('metabolismRate');
        const customHalfLife = document.getElementById('customHalfLife');
        
        metabolismRate.addEventListener('change', () => {
            if (metabolismRate.value === 'custom') {
                customHalfLife.style.display = 'block';
                customHalfLife.value = '';
            } else {
                customHalfLife.style.display = 'none';
            }
            this.updateChart();
        });

        // Custom half-life input change
        customHalfLife.addEventListener('input', () => {
            this.updateChart();
        });

        // Add intake button
        document.getElementById('add-intake').addEventListener('click', () => {
            this.addIntakeRow();
        });

        // Initial intake row setup
        this.setupIntakeRow(document.querySelector('.intake-row'));
    }

    addIntakeRow() {
        const container = document.getElementById('intakes-container');
        const newRow = document.createElement('div');
        newRow.className = 'intake-row';
        newRow.setAttribute('data-id', this.intakeCounter);
        
        const currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + this.intakeCounter);
        const timeString = currentTime.toTimeString().slice(0, 5);

        newRow.innerHTML = `
            <div class="time-input">
                <label>Time:</label>
                <input type="time" class="time-field" value="${timeString}">
            </div>
            
            <div class="drink-input">
                <label>Drink:</label>
                <select class="drink-select">
                    <option value="custom">Custom (mg/100ml)</option>
                    <option value="20">Green Tea (20mg/100ml)</option>
                    <option value="30">Black Tea (30mg/100ml)</option>
                    <option value="32">Cola (32mg/100ml)</option>
                    <option value="40" selected>Filtered Coffee (40mg/100ml)</option>
                    <option value="80">Energy Drink (80mg/100ml)</option>
                    <option value="212">Espresso (212mg/100ml)</option>
                </select>
                <input type="number" class="custom-caffeine" placeholder="mg/100ml" min="0" style="display:none;">
            </div>

            <div class="amount-input">
                <label>Amount:</label>
                <select class="amount-select">
                    <option value="custom">Custom (ml)</option>
                    <option value="30">Espresso shot (30ml)</option>
                    <option value="200" selected>Small mug (200ml)</option>
                    <option value="250">Cup (250ml)</option>
                    <option value="330">Can (330ml)</option>
                    <option value="350">Large mug (350ml)</option>
                    <option value="500">Bottle (500ml)</option>
                </select>
                <input type="number" class="custom-amount" placeholder="ml" min="0" style="display:none;">
            </div>

            <div class="calculated-caffeine">
                <span class="caffeine-amount">0 mg</span>
            </div>

            <button class="duplicate-intake">⧉</button>
            <button class="remove-intake">×</button>
        `;

        container.appendChild(newRow);
        this.setupIntakeRow(newRow);
        this.intakeCounter++;
        this.updateChart();
    }

    setupIntakeRow(row) {
        const drinkSelect = row.querySelector('.drink-select');
        const customCaffeine = row.querySelector('.custom-caffeine');
        const amountSelect = row.querySelector('.amount-select');
        const customAmount = row.querySelector('.custom-amount');
        const removeBtn = row.querySelector('.remove-intake');
        const duplicateBtn = row.querySelector('.duplicate-intake');
        const timeField = row.querySelector('.time-field');

        // Show/hide custom inputs
        drinkSelect.addEventListener('change', () => {
            if (drinkSelect.value === 'custom') {
                customCaffeine.style.display = 'block';
                customCaffeine.value = '';
            } else {
                customCaffeine.style.display = 'none';
            }
            this.calculateCaffeine(row);
        });

        amountSelect.addEventListener('change', () => {
            if (amountSelect.value === 'custom') {
                customAmount.style.display = 'block';
                customAmount.value = '';
            } else {
                customAmount.style.display = 'none';
            }
            this.calculateCaffeine(row);
        });

        // Update calculations on input changes
        [customCaffeine, customAmount, timeField].forEach(input => {
            input.addEventListener('input', () => {
                this.calculateCaffeine(row);
            });
        });

        // Duplicate intake row
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => {
                this.duplicateIntake(row);
            });
        }

        // Remove intake row
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                row.remove();
                this.updateChart();
                this.updateRemoveButtons();
            });
        }

        // Initial calculation
        this.calculateCaffeine(row);
        this.updateRemoveButtons();
    }

    duplicateIntake(sourceRow) {
        const container = document.getElementById('intakes-container');
        const newRow = document.createElement('div');
        newRow.className = 'intake-row';
        newRow.setAttribute('data-id', this.intakeCounter);
        
        // Get source row values
        const sourceTime = sourceRow.querySelector('.time-field').value;
        const sourceDrinkSelect = sourceRow.querySelector('.drink-select').value;
        const sourceCustomCaffeine = sourceRow.querySelector('.custom-caffeine').value;
        const sourceAmountSelect = sourceRow.querySelector('.amount-select').value;
        const sourceCustomAmount = sourceRow.querySelector('.custom-amount').value;
        
        // Calculate new time (+1 hour)
        const [hours, minutes] = sourceTime.split(':').map(Number);
        const newHours = (hours + 1) % 24;
        const newTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        newRow.innerHTML = `
            <div class="time-input">
                <label>Time:</label>
                <input type="time" class="time-field" value="${newTime}">
            </div>
            
            <div class="drink-input">
                <label>Drink:</label>
                <select class="drink-select">
                    <option value="custom">Custom (mg/100ml)</option>
                    <option value="20">Green Tea (20mg/100ml)</option>
                    <option value="30">Black Tea (30mg/100ml)</option>
                    <option value="32">Cola (32mg/100ml)</option>
                    <option value="40" selected>Filtered Coffee (40mg/100ml)</option>
                    <option value="80">Energy Drink (80mg/100ml)</option>
                    <option value="212">Espresso (212mg/100ml)</option>
                </select>
                <input type="number" class="custom-caffeine" placeholder="mg/100ml" min="0" style="display:none;" value="${sourceCustomCaffeine}">
            </div>

            <div class="amount-input">
                <label>Amount:</label>
                <select class="amount-select">
                    <option value="custom">Custom (ml)</option>
                    <option value="30">Espresso shot (30ml)</option>
                    <option value="200" selected>Small mug (200ml)</option>
                    <option value="250">Cup (250ml)</option>
                    <option value="330">Can (330ml)</option>
                    <option value="350">Large mug (350ml)</option>
                    <option value="500">Bottle (500ml)</option>
                </select>
                <input type="number" class="custom-amount" placeholder="ml" min="0" style="display:none;" value="${sourceCustomAmount}">
            </div>

            <div class="calculated-caffeine">
                <span class="caffeine-amount">0 mg</span>
            </div>

            <button class="duplicate-intake">⧉</button>
            <button class="remove-intake">×</button>
        `;

        // Insert after the source row
        sourceRow.parentNode.insertBefore(newRow, sourceRow.nextSibling);
        
        // Set the select values
        const newDrinkSelect = newRow.querySelector('.drink-select');
        const newAmountSelect = newRow.querySelector('.amount-select');
        const newCustomCaffeine = newRow.querySelector('.custom-caffeine');
        const newCustomAmount = newRow.querySelector('.custom-amount');
        
        newDrinkSelect.value = sourceDrinkSelect;
        newAmountSelect.value = sourceAmountSelect;
        
        // Show custom inputs if needed
        if (sourceDrinkSelect === 'custom') {
            newCustomCaffeine.style.display = 'block';
        }
        if (sourceAmountSelect === 'custom') {
            newCustomAmount.style.display = 'block';
        }

        this.setupIntakeRow(newRow);
        this.intakeCounter++;
        this.updateChart();
    }

    updateRemoveButtons() {
        const rows = document.querySelectorAll('.intake-row');
        rows.forEach((row, index) => {
            const removeBtn = row.querySelector('.remove-intake');
            if (removeBtn) {
                removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
            }
        });
    }

    calculateCaffeine(row) {
        const drinkSelect = row.querySelector('.drink-select');
        const customCaffeine = row.querySelector('.custom-caffeine');
        const amountSelect = row.querySelector('.amount-select');
        const customAmount = row.querySelector('.custom-amount');
        const caffeineAmountSpan = row.querySelector('.caffeine-amount');

        let caffeinePerMl = 0;
        if (drinkSelect.value === 'custom') {
            caffeinePerMl = parseFloat(customCaffeine.value) / 100 || 0;
        } else {
            caffeinePerMl = parseFloat(drinkSelect.value) / 100;
        }

        let amount = 0;
        if (amountSelect.value === 'custom') {
            amount = parseFloat(customAmount.value) || 0;
        } else {
            amount = parseFloat(amountSelect.value);
        }

        const totalCaffeine = Math.round(caffeinePerMl * amount);
        caffeineAmountSpan.textContent = `${totalCaffeine} mg`;

        this.updateChart();
    }

    getIntakeData() {
        const rows = document.querySelectorAll('.intake-row');
        const intakes = [];

        rows.forEach(row => {
            const timeField = row.querySelector('.time-field');
            const caffeineAmount = row.querySelector('.caffeine-amount');
            
            const time = timeField.value;
            const caffeine = parseInt(caffeineAmount.textContent) || 0;

            if (time && caffeine > 0) {
                intakes.push({
                    time: time,
                    caffeine: caffeine
                });
            }
        });

        return intakes.sort((a, b) => a.time.localeCompare(b.time));
    }

    calculateCaffeineLevel(intakes, targetTime, halfLife) {
        let total = 0;
        const lambda = Math.log(2) / halfLife;

        intakes.forEach(intake => {
            const intakeTime = this.timeToHours(intake.time);
            const timeDiff = targetTime - intakeTime;

            if (timeDiff >= 0) {
                total += intake.caffeine * Math.exp(-lambda * timeDiff);
            }
        });

        return total;
    }

    timeToHours(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    generateTimePoints(intakes) {
        if (intakes.length === 0) return [];

        const intakeTimes = intakes.map(i => this.timeToHours(i.time));
        const startTime = Math.min(...intakeTimes);
        let endTime = Math.max(...intakeTimes) + 15;
        
        // Handle case where we cross midnight (endTime > 24)
        // Keep the continuous time scale for proper calculation
        
        const points = [];
        for (let t = startTime; t <= endTime; t += 0.25) {
            points.push(t);
        }
        return points;
    }

    formatHour(hour) {
        let h = Math.floor(hour) % 24;
        if (h < 0) h += 24; // Handle negative hours
        
        let displayHour, period;
        if (h === 0) {
            displayHour = 12;
            period = 'AM';
        } else if (h < 12) {
            displayHour = h;
            period = 'AM';
        } else if (h === 12) {
            displayHour = 12;
            period = 'PM';
        } else {
            displayHour = h - 12;
            period = 'PM';
        }
        
        return `${displayHour}${period}`;
    }

    updateChart() {
        const intakes = this.getIntakeData();
        const metabolismRate = document.getElementById('metabolismRate');
        const customHalfLife = document.getElementById('customHalfLife');
        
        let halfLife;
        if (metabolismRate.value === 'custom') {
            halfLife = parseFloat(customHalfLife.value) || 5; // Default to 5 if empty
        } else {
            halfLife = parseFloat(metabolismRate.value);
        }
        
        if (intakes.length === 0) {
            this.renderEmptyChart();
            return;
        }

        const timePoints = this.generateTimePoints(intakes);
        const data = timePoints.map(time => ({
            time: time,
            caffeine: this.calculateCaffeineLevel(intakes, time, halfLife)
        }));

        this.renderChart(data);
    }

    renderEmptyChart() {
        d3.select('#chart').selectAll('*').remove();
        
        const svg = d3.select('#chart')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
            
        svg.append('text')
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('text-anchor', 'middle')
            .attr('fill', '#999')
            .style('font-size', '18px')
            .text('Add caffeine intakes to see the chart');
    }

    renderChart(data) {
        // Clear previous chart
        d3.select('#chart').selectAll('*').remove();

        const margin = { top: 20, right: 30, bottom: 60, left: 70 };
        const container = document.getElementById('chart');
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;

        const svg = d3.select('#chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.time))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.caffeine) * 1.1])
            .range([height, 0]);

        // Grid lines
        g.selectAll('.grid-line-x')
            .data(xScale.ticks())
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', height);

        g.selectAll('.grid-line-y')
            .data(yScale.ticks())
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d));

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.caffeine))
            .curve(d3.curveMonotoneX);

        // Draw line
        g.append('path')
            .datum(data)
            .attr('class', 'caffeine-line')
            .attr('d', line);

        // X-axis with custom ticks
        const xExtent = d3.extent(data, d => d.time);
        const timeRange = xExtent[1] - xExtent[0];
        
        // Generate hour ticks - keep same density as before
        const tickInterval = timeRange <= 6 ? 1 : timeRange <= 12 ? 1 : timeRange <= 24 ? 2 : 3;
        const startHour = Math.floor(xExtent[0]);
        const endHour = Math.ceil(xExtent[1]);
        
        const hourTicks = [];
        for (let h = startHour; h <= endHour; h += tickInterval) {
            hourTicks.push(h);
        }

        const xAxis = d3.axisBottom(xScale)
            .tickValues(hourTicks)
            .tickFormat(d => this.formatHour(d));

        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        // Y-axis
        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale));

        // Axis labels
        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Caffeine Level (mg)');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(${width/2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .text('Time');

        // Interactive elements
        const hoverLine = g.append('line')
            .attr('class', 'hover-line')
            .attr('y1', 0)
            .attr('y2', height);

        const hoverCircle = g.append('circle')
            .attr('class', 'hover-circle');

        // Invisible rect for mouse events
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mousemove', (event) => this.handleMouseMove(event, data, xScale, yScale, hoverLine, hoverCircle))
            .on('mouseout', () => this.handleMouseOut(hoverLine, hoverCircle));
    }

    handleMouseMove(event, data, xScale, yScale, hoverLine, hoverCircle) {
        const [mouseX] = d3.pointer(event);
        const time = xScale.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector(d => d.time).left;
        const index = bisect(data, time, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        const d = time - d0.time > d1.time - time ? d1 : d0;

        // Update hover elements
        hoverLine
            .attr('x1', xScale(d.time))
            .attr('x2', xScale(d.time))
            .style('opacity', 1);

        hoverCircle
            .attr('cx', xScale(d.time))
            .attr('cy', yScale(d.caffeine))
            .style('opacity', 1);

        // Update tooltip
        const tooltip = d3.select('#tooltip');
        tooltip
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(`
                <strong>Time:</strong> ${this.formatHour(d.time)}<br>
                <strong>Caffeine:</strong> ${Math.round(d.caffeine)} mg
            `);
    }

    handleMouseOut(hoverLine, hoverCircle) {
        hoverLine.style('opacity', 0);
        hoverCircle.style('opacity', 0);
        d3.select('#tooltip').style('opacity', 0);
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CaffeineCalculator();
});