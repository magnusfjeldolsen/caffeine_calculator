#%%
import math

def caffeine_amount(initial_amount, half_life, time_elapsed):
    """
    Calculate remaining caffeine in the body using exponential decay.

    Parameters:
        initial_amount (float): Initial caffeine amount (mg).
        half_life (float): Half-life of caffeine (hours).
        time_elapsed (float): Time after consumption (hours).

    Returns:
        float: Remaining caffeine (mg).
    """
    # decay constant
    lam = math.log(2) / half_life
    
    # exponential decay formula
    remaining = initial_amount * math.exp(-lam * time_elapsed)
    
    return remaining

# Example:
print(caffeine_amount(200, 5, 8))  # 200 mg caffeine, 5h half-life, after 8 hours

# %%

import math
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def parse_time(time_str, reference_time):
    """Convert '8AM'/'2PM' etc. into hours since reference_time."""
    time_obj = datetime.strptime(time_str, "%I%p")
    # adjust date if rollover happens (e.g. past midnight)
    if time_obj < reference_time:
        time_obj += timedelta(days=1)
    return (time_obj - reference_time).total_seconds() / 3600  # in hours

def caffeine_simulation(caffeine_intakes, half_life=5, step=0.25):
    """
    Simulate caffeine levels in the body after multiple intakes.

    Parameters:
        caffeine_intakes (dict): e.g. {'8AM':100,'9AM':80}
        half_life (float): Half-life of caffeine (hours).
        step (float): Simulation time step (hours).
    """
    # reference: first intake time
    first_time = datetime.strptime(list(caffeine_intakes.keys())[0], "%I%p")
    
    # convert times into hours since first intake
    intakes = {parse_time(t, first_time): amt for t, amt in caffeine_intakes.items()}
    
    # simulation time range: until 12h after last intake
    total_duration = max(intakes.keys()) + 12
    times = [i * step for i in range(int(total_duration / step) + 1)]
    
    lam = math.log(2) / half_life
    
    caffeine_levels = []
    for t in times:
        total = 0
        for intake_time, dose in intakes.items():
            if t >= intake_time:  # only apply after intake happened
                total += dose * math.exp(-lam * (t - intake_time))
        caffeine_levels.append(total)
    
    # Plot
    plt.figure(figsize=(10,6))
    plt.plot(times, caffeine_levels, label="Caffeine level (mg)")
    plt.xlabel("Time since first intake (hours)")
    plt.ylabel("Caffeine in body (mg)")
    plt.title("Caffeine Metabolism Simulation")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.show()
    
    return times, caffeine_levels


# Example usage
caffeine_intakes = {"7AM": 120, "8AM": 80, "9AM": 80, "10AM": 80, "12PM": 80}
caffeine_simulation(caffeine_intakes, half_life=5)
