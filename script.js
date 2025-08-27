class CaffeineCalculator {
    constructor() {
        this.intakeCounter = 1;
        this.init();
    }

    init() {
        this.setDefaultStartDate();
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateChart();
    }

    setDefaultStartDate() {
        const startDateInput = document.getElementById('startDate');
        if (!startDateInput.value) {
            const today = new Date();
            startDateInput.value = today.toISOString().split('T')[0];
        }
        this.updateIntakeDates();
    }

    updateIntakeDates() {
        const startDate = document.getElementById('startDate').value;
        if (!startDate) return;
        
        const rows = document.querySelectorAll('.intake-row');
        if (rows.length === 0) return;
        
        // If there's only one row or it's the initial setup, just set it to start date
        if (rows.length === 1 || !rows[0].querySelector('.date-field').value) {
            const firstRow = rows[0];
            const firstDateField = firstRow.querySelector('.date-field');
            if (firstDateField) {
                firstDateField.value = startDate;
            }
            this.updateSequentialDates();
            return;
        }
        
        // Calculate each intake's offset from the first intake in hours (before modifying anything)
        const firstRow = rows[0];
        const firstDateField = firstRow.querySelector('.date-field');
        const firstTimeField = firstRow.querySelector('.time-field');
        const originalFirstDateTime = new Date(`${firstDateField.value}T${firstTimeField.value}:00`);
        
        // Calculate all offsets first
        const intakeOffsets = [];
        rows.forEach(row => {
            const dateField = row.querySelector('.date-field');
            const timeField = row.querySelector('.time-field');
            
            if (dateField && dateField.value && timeField && timeField.value) {
                const currentIntakeDateTime = new Date(`${dateField.value}T${timeField.value}:00`);
                const hoursOffset = (currentIntakeDateTime - originalFirstDateTime) / (1000 * 60 * 60);
                intakeOffsets.push(hoursOffset);
            } else {
                intakeOffsets.push(0);
            }
        });
        
        // Now apply the new start date + offsets to all intakes
        const newStartDate = new Date(startDate);
        const [firstHours, firstMinutes] = firstTimeField.value.split(':').map(Number);
        
        rows.forEach((row, index) => {
            const dateField = row.querySelector('.date-field');
            
            if (dateField) {
                // Calculate new datetime based on new start date + this intake's offset
                const newIntakeDateTime = new Date(newStartDate);
                newIntakeDateTime.setHours(firstHours, firstMinutes, 0, 0);
                newIntakeDateTime.setTime(newIntakeDateTime.getTime() + intakeOffsets[index] * 60 * 60 * 1000);
                
                // Update the date field
                dateField.value = newIntakeDateTime.toISOString().split('T')[0];
            }
        });
    }

    updateSequentialDates() {
        const rows = document.querySelectorAll('.intake-row');
        if (rows.length <= 1) return;
        
        const startDate = document.getElementById('startDate').value;
        if (!startDate) return;
        
        let currentDate = new Date(startDate);
        let previousTime = null;
        
        rows.forEach((row, index) => {
            const dateField = row.querySelector('.date-field');
            const timeField = row.querySelector('.time-field');
            
            if (index === 0) {
                // First row keeps start date
                dateField.value = startDate;
                if (timeField.value) {
                    const [hours, minutes] = timeField.value.split(':').map(Number);
                    previousTime = hours * 60 + minutes; // Convert to minutes
                }
                return;
            }
            
            if (timeField.value && previousTime !== null) {
                const [hours, minutes] = timeField.value.split(':').map(Number);
                const currentTimeMinutes = hours * 60 + minutes;
                
                // If current time is earlier than previous time, it's the next day
                if (currentTimeMinutes <= previousTime) {
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                dateField.value = currentDate.toISOString().split('T')[0];
                previousTime = currentTimeMinutes;
            }
        });
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
            this.saveToStorage();
        });

        // Custom half-life input change
        customHalfLife.addEventListener('input', () => {
            this.updateChart();
            this.saveToStorage();
        });

        // Start date change
        const startDate = document.getElementById('startDate');
        startDate.addEventListener('change', () => {
            this.updateIntakeDates();
            this.updateChart();
            this.saveToStorage();
        });

        // Add intake button
        document.getElementById('add-intake').addEventListener('click', () => {
            this.addIntakeRow();
        });

        // Clear all button
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAll();
        });

        // Setup any existing intake rows (in case nothing was loaded from storage)
        const existingRows = document.querySelectorAll('.intake-row');
        existingRows.forEach(row => {
            // Only set up if not already set up (check if it has event listeners)
            if (!row.hasAttribute('data-setup')) {
                this.setupIntakeRow(row);
                row.setAttribute('data-setup', 'true');
            }
        });
    }

    addIntakeRow() {
        const container = document.getElementById('intakes-container');
        const newRow = document.createElement('div');
        newRow.className = 'intake-row';
        newRow.setAttribute('data-id', this.intakeCounter);
        
        // Calculate time based on previous intake + 1 hour
        const existingRows = container.querySelectorAll('.intake-row');
        let timeString = '08:00'; // Default fallback
        
        if (existingRows.length > 0) {
            const lastRow = existingRows[existingRows.length - 1];
            const lastTimeField = lastRow.querySelector('.time-field');
            if (lastTimeField && lastTimeField.value) {
                const [hours, minutes] = lastTimeField.value.split(':').map(Number);
                const newHours = (hours + 1) % 24;
                timeString = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }

        newRow.innerHTML = `
            <div class="date-input">
                <label>Date:</label>
                <input type="date" class="date-field">
            </div>
            
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
        this.updateSequentialDates(); // Set the date for the new row based on timeline
        this.updateChart();
        this.saveToStorage();
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all caffeine intakes?')) {
            // Reset to single row with default values
            const container = document.getElementById('intakes-container');
            container.innerHTML = `
                <div class="intake-row" data-id="0">
                    <div class="date-input">
                        <label>Date:</label>
                        <input type="date" class="date-field">
                    </div>
                    
                    <div class="time-input">
                        <label>Time:</label>
                        <input type="time" class="time-field" value="08:00">
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
                    <button class="remove-intake" style="display:none;">×</button>
                </div>
            `;
            
            // Reset counter and metabolism rate
            this.intakeCounter = 1;
            document.getElementById('metabolismRate').value = '5';
            document.getElementById('customHalfLife').style.display = 'none';
            
            // Setup the new row
            const newRow = document.querySelector('.intake-row');
            this.setupIntakeRow(newRow);
            this.updateIntakeDates(); // Set the date for the new row
            this.updateChart();
            this.saveToStorage();
        }
    }

    saveToStorage() {
        const data = {
            metabolismRate: document.getElementById('metabolismRate').value,
            customHalfLife: document.getElementById('customHalfLife').value,
            startDate: document.getElementById('startDate').value,
            intakes: this.getIntakeStorageData(),
            intakeCounter: this.intakeCounter
        };
        localStorage.setItem('caffeineCalculatorData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('caffeineCalculatorData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Restore metabolism rate
                document.getElementById('metabolismRate').value = data.metabolismRate || '5';
                if (data.metabolismRate === 'custom') {
                    document.getElementById('customHalfLife').style.display = 'block';
                    document.getElementById('customHalfLife').value = data.customHalfLife || '';
                }
                
                // Restore start date
                if (data.startDate) {
                    document.getElementById('startDate').value = data.startDate;
                }
                
                // Restore intake counter
                this.intakeCounter = data.intakeCounter || 1;
                
                // Restore intakes
                if (data.intakes && data.intakes.length > 0) {
                    this.restoreIntakes(data.intakes);
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    getIntakeStorageData() {
        const rows = document.querySelectorAll('.intake-row');
        const intakes = [];
        
        rows.forEach(row => {
            const dateField = row.querySelector('.date-field');
            const timeField = row.querySelector('.time-field');
            const drinkSelect = row.querySelector('.drink-select');
            const customCaffeine = row.querySelector('.custom-caffeine');
            const amountSelect = row.querySelector('.amount-select');
            const customAmount = row.querySelector('.custom-amount');
            
            intakes.push({
                date: dateField.value,
                time: timeField.value,
                drinkValue: drinkSelect.value,
                customCaffeineValue: customCaffeine.value,
                amountValue: amountSelect.value,
                customAmountValue: customAmount.value
            });
        });
        
        return intakes;
    }

    restoreIntakes(intakes) {
        const container = document.getElementById('intakes-container');
        container.innerHTML = '';
        
        intakes.forEach((intake, index) => {
            const row = document.createElement('div');
            row.className = 'intake-row';
            row.setAttribute('data-id', index);
            
            row.innerHTML = `
                <div class="date-input">
                    <label>Date:</label>
                    <input type="date" class="date-field" value="${intake.date || ''}">
                </div>
                
                <div class="time-input">
                    <label>Time:</label>
                    <input type="time" class="time-field" value="${intake.time}">
                </div>
                
                <div class="drink-input">
                    <label>Drink:</label>
                    <select class="drink-select">
                        <option value="custom">Custom (mg/100ml)</option>
                        <option value="20">Green Tea (20mg/100ml)</option>
                        <option value="30">Black Tea (30mg/100ml)</option>
                        <option value="32">Cola (32mg/100ml)</option>
                        <option value="40">Filtered Coffee (40mg/100ml)</option>
                        <option value="80">Energy Drink (80mg/100ml)</option>
                        <option value="212">Espresso (212mg/100ml)</option>
                    </select>
                    <input type="number" class="custom-caffeine" placeholder="mg/100ml" min="0" style="display:none;" value="${intake.customCaffeineValue}">
                </div>

                <div class="amount-input">
                    <label>Amount:</label>
                    <select class="amount-select">
                        <option value="custom">Custom (ml)</option>
                        <option value="30">Espresso shot (30ml)</option>
                        <option value="200">Small mug (200ml)</option>
                        <option value="250">Cup (250ml)</option>
                        <option value="330">Can (330ml)</option>
                        <option value="350">Large mug (350ml)</option>
                        <option value="500">Bottle (500ml)</option>
                    </select>
                    <input type="number" class="custom-amount" placeholder="ml" min="0" style="display:none;" value="${intake.customAmountValue}">
                </div>

                <div class="calculated-caffeine">
                    <span class="caffeine-amount">0 mg</span>
                </div>

                <button class="duplicate-intake">⧉</button>
                <button class="remove-intake"${intakes.length === 1 ? ' style="display:none;"' : ''}>×</button>
            `;
            
            container.appendChild(row);
            
            // Set select values
            const drinkSelect = row.querySelector('.drink-select');
            const amountSelect = row.querySelector('.amount-select');
            const customCaffeine = row.querySelector('.custom-caffeine');
            const customAmount = row.querySelector('.custom-amount');
            
            drinkSelect.value = intake.drinkValue;
            amountSelect.value = intake.amountValue;
            
            // Show custom inputs if needed
            if (intake.drinkValue === 'custom') {
                customCaffeine.style.display = 'block';
            }
            if (intake.amountValue === 'custom') {
                customAmount.style.display = 'block';
            }
            
            this.setupIntakeRow(row);
        });
    }

    setupIntakeRow(row) {
        const dateField = row.querySelector('.date-field');
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
            this.saveToStorage();
        });

        amountSelect.addEventListener('change', () => {
            if (amountSelect.value === 'custom') {
                customAmount.style.display = 'block';
                customAmount.value = '';
            } else {
                customAmount.style.display = 'none';
            }
            this.calculateCaffeine(row);
            this.saveToStorage();
        });

        // Update calculations on input changes
        [customCaffeine, customAmount].forEach(input => {
            input.addEventListener('input', () => {
                this.calculateCaffeine(row);
                this.saveToStorage();
            });
        });

        // Time field changes should also update sequential dates
        timeField.addEventListener('input', () => {
            this.updateSequentialDates();
            this.calculateCaffeine(row); // This already calls updateChart
            this.saveToStorage();
        });

        // Date field changes should also update chart
        if (dateField) {
            dateField.addEventListener('input', () => {
                this.updateChart();
                this.saveToStorage();
            });
        }

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
                this.updateRemoveButtons();
                this.updateChart();
                this.saveToStorage();
            });
        }

        // Initial calculation
        this.calculateCaffeine(row);
        this.updateRemoveButtons();
        
        // Mark as set up to prevent double setup
        row.setAttribute('data-setup', 'true');
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
            <div class="date-input">
                <label>Date:</label>
                <input type="date" class="date-field">
            </div>
            
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
        this.updateSequentialDates();
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
            const dateField = row.querySelector('.date-field');
            const timeField = row.querySelector('.time-field');
            const caffeineAmount = row.querySelector('.caffeine-amount');
            
            const date = dateField.value;
            const time = timeField.value;
            const caffeine = parseInt(caffeineAmount.textContent) || 0;

            if (date && time && caffeine > 0) {
                intakes.push({
                    date: date,
                    time: time,
                    caffeine: caffeine,
                    datetime: new Date(`${date}T${time}:00`)
                });
            }
        });

        return intakes.sort((a, b) => a.datetime - b.datetime);
    }

    calculateCaffeineLevel(intakes, targetDatetime, halfLife) {
        let total = 0;
        const lambda = Math.log(2) / halfLife;

        intakes.forEach(intake => {
            const timeDiffHours = (targetDatetime - intake.datetime) / (1000 * 60 * 60); // Convert ms to hours

            if (timeDiffHours >= 0) {
                total += intake.caffeine * Math.exp(-lambda * timeDiffHours);
            }
        });

        return total;
    }

    generateTimePoints(intakes) {
        if (intakes.length === 0) return [];

        const startDatetime = new Date(Math.min(...intakes.map(i => i.datetime)));
        const endDatetime = new Date(Math.max(...intakes.map(i => i.datetime)));
        endDatetime.setHours(endDatetime.getHours() + 15); // Add 15 hours after last intake
        
        const points = [];
        const currentTime = new Date(startDatetime);
        
        // Generate points every 15 minutes
        while (currentTime <= endDatetime) {
            points.push(new Date(currentTime));
            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
        
        return points;
    }

    formatDateTime(datetime) {
        const date = new Date(datetime);
        const h = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        
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
        
        return `${month}/${day} ${displayHour}${period}`;
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
        const data = timePoints.map(datetime => ({
            datetime: datetime,
            caffeine: this.calculateCaffeineLevel(intakes, datetime, halfLife)
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
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.datetime))
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
            .x(d => xScale(d.datetime))
            .y(d => yScale(d.caffeine))
            .curve(d3.curveMonotoneX);

        // Draw line
        g.append('path')
            .datum(data)
            .attr('class', 'caffeine-line')
            .attr('d', line);

        // X-axis with datetime formatting
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => this.formatDateTime(d));

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

        // Fixed info box at top right
        const infoBox = g.append('g')
            .attr('class', 'info-box')
            .style('opacity', 0);

        const infoBoxRect = infoBox.append('rect')
            .attr('class', 'info-box-rect')
            .attr('x', width - 200)
            .attr('y', 10)
            .attr('width', 190)
            .attr('height', 50)
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .attr('stroke', 'rgba(255, 255, 255, 0.2)')
            .attr('stroke-width', 1);

        const infoBoxText = infoBox.append('text')
            .attr('class', 'info-box-text')
            .attr('x', width - 105)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '14px');

        // Invisible rect for mouse events
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mousemove', (event) => this.handleMouseMove(event, data, xScale, yScale, hoverLine, hoverCircle, infoBox, infoBoxText))
            .on('mouseout', () => this.handleMouseOut(hoverLine, hoverCircle, infoBox));
    }

    handleMouseMove(event, data, xScale, yScale, hoverLine, hoverCircle, infoBox, infoBoxText) {
        const [mouseX] = d3.pointer(event);
        const datetime = xScale.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector(d => d.datetime).left;
        const index = bisect(data, datetime, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        
        // Handle edge cases
        let d;
        if (!d0) d = d1;
        else if (!d1) d = d0;
        else d = Math.abs(datetime - d0.datetime) < Math.abs(datetime - d1.datetime) ? d0 : d1;

        // Only update if we have valid data
        if (!d) return;

        // Update hover elements
        hoverLine
            .attr('x1', xScale(d.datetime))
            .attr('x2', xScale(d.datetime))
            .style('opacity', 1);

        hoverCircle
            .attr('cx', xScale(d.datetime))
            .attr('cy', yScale(d.caffeine))
            .style('opacity', 1);

        // Update fixed info box at top right
        infoBoxText.text(`${this.formatDateTime(d.datetime)} • ${Math.round(d.caffeine)} mg`);
        infoBox.style('opacity', 1);
    }

    handleMouseOut(hoverLine, hoverCircle, infoBox) {
        hoverLine.style('opacity', 0);
        hoverCircle.style('opacity', 0);
        infoBox.style('opacity', 0);
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CaffeineCalculator();
});