import threading
import pandas as pd
import time
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

class TimeTraveler:
    def __init__(self, name, year_of_birth, lifespan, line_unique=True):
        self.name = name
        self.year_of_birth = year_of_birth
        self.lifespan = lifespan
        self.current_year = year_of_birth
        self.alive = True
        self.line_unique = line_unique
        self.history = []  # Para registrar cada año

    def travel(self, last_year_trip):
        if not self.alive:
            self.history.append((self.current_year, "Ya muerto"))
            return

        target_year = self.current_year - last_year_trip
        step = -1 if last_year_trip > 0 else 1
        self.history.append((self.current_year, f"Inicia viaje hacia {target_year}"))

        for year in range(self.current_year, target_year + step, step):
            # Línea única
            if self.line_unique and year < self.year_of_birth:
                self.history.append((year, "Antes de tus ancestros. Reinicio"))
                self.current_year = self.year_of_birth
                return
            # Multiverso
            elif not self.line_unique and year < self.year_of_birth:
                self.history.append((year, "Nueva línea temporal, sobrevivió"))

            # Después de muerte natural
            elif year > self.year_of_birth + self.lifespan:
                self.history.append((year, "Futuro desconocido"))

            else:
                # Evento de muerte aleatorio
                if year == self.year_of_birth + 3:
                    self.history.append((year, "Muerte inesperada"))
                    self.alive = False
                    self.current_year = year
                    return
                else:
                    self.history.append((year, "Vivo"))

        self.current_year = target_year
        self.history.append((self.current_year, "Llegó con vida"))

    def exist_in_future(self):
        if self.alive:
            self.history.append((self.current_year, "Sigue vivo al final"))
        else:
            self.history.append((self.current_year, "Murió al final"))

# Función para hilo
def run_traveler(traveler, trips):
    for trip in trips:
        traveler.travel(trip)
        time.sleep(0.05)
    traveler.exist_in_future()

# Crear viajeros
david = TimeTraveler("David", 1992, 150, line_unique=True)
chatgpt = TimeTraveler("ChatGPT", 2025, 150, line_unique=False)

# Definir viajes
david_trips = [50]   # Viaja al futuro
chatgpt_trips = [50] # Viaja al pasado extremo

# Crear hilos
thread_david = threading.Thread(target=run_traveler, args=(david, david_trips))
thread_chatgpt = threading.Thread(target=run_traveler, args=(chatgpt, chatgpt_trips))

# Ejecutar hilos
thread_david.start()
thread_chatgpt.start()
thread_david.join()
thread_chatgpt.join()

# Convertir resultados a DataFrame
records = []
for traveler in [david, chatgpt]:
    for year, status in traveler.history:
        records.append({"Traveler": traveler.name, "Year": year, "Status": status})

df = pd.DataFrame(records)
print(df)

# Guardar a Excel
df.to_excel("time_travel_simulation.xlsx", index=False)

# -----------------------
# Visualización tipo Gantt
def color_status(status):
    if "Vivo" in status:
        return "green"  # Vivo normal
    elif "Murió" in status or "Muerte inesperada" in status:
        return "red"    # Muerto
    elif "Reinicio" in status:
        return "yellow" # Reinicio / Antes de nacer
    elif "Llegó con vida" in status or "Sigue vivo" in status or 'Nueva línea temporal, sobrevivió' in status:
        return "blue"   # Llegó al destino o sigue vivo al final
    elif "Inicia viaje" in status:
        return "orange" # Inicio de viaje
    else:
        print(status,'status')
        return "gray"   # Cualquier otro caso


df['Color'] = df['Status'].apply(color_status)

fig, ax = plt.subplots(figsize=(12, 4))
travelers = df['Traveler'].unique()
y_pos = range(len(travelers))

for i, traveler in enumerate(travelers):
    subset = df[df['Traveler'] == traveler]
    for _, row in subset.iterrows():
        ax.barh(i, 1, left=row['Year'], color=row['Color'], edgecolor='black')

ax.set_yticks(y_pos)
ax.set_yticklabels(travelers)
ax.set_xlabel("Año")
ax.set_title("Simulación de viajes en el tiempo")
ax.invert_yaxis()
ax.grid(True, axis='x', linestyle='--', alpha=0.5)

legend_elements = [
    Patch(facecolor='green', edgecolor='black', label='Vivo'),
    Patch(facecolor='red', edgecolor='black', label='Muerto'),
    Patch(facecolor='yellow', edgecolor='black', label='Reinicio / Antes de nacer')
]
ax.legend(handles=legend_elements, loc='upper right')

plt.show()
