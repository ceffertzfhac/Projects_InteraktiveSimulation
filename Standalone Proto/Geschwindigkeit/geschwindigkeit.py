import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, CheckButtons, RadioButtons
# %matplotlib qt # Wenn Sie dies in einem Jupyter Notebook/Lab verwenden, lassen Sie es drin.

# Globale Variablen für Daten und Plotgrenzen
t_values = np.linspace(0, 20, 10000) # Zeit t in Sekunden
position_values = np.zeros_like(t_values) # Ort x in Metern
velocity_values = np.zeros_like(t_values) # Geschwindigkeit v in m/s

t_min, t_max = t_values[0], t_values[-1]
position_min, position_max = -1, 1 # Start-Platzhalter

# Startwerte für Slider
i0 = int(len(t_values) / 2) # Start in der Mitte des Zeitbereichs
delta_t_initial = 1.0 # Initiales Delta t in Sekunden
delta_index_initial = int(delta_t_initial / (t_values[1] - t_values[0])) # Delta in Index-Einheiten

# Globale Statusvariablen für Checkboxen
show_tangent = False
show_triangle = False
centered_mode = True

# --- Plot Setup ---
fig, ax = plt.subplots(figsize=(10, 7))

# Haupttitel für die gesamte Figur, über allen UI-Elementen
fig.suptitle("Geschwindigkeit als Steigung der Kurve im Ort-Zeit-Diagramm", fontsize=16, weight='bold', y=0.98)

# Anpassung des Layouts für Diagramm und Widgets
# fig_bottom und fig_top werden angepasst, um den Plot nach oben zu verschieben
fig_left = 0.1
fig_right = 0.95
fig_bottom = 0.21 # Um ca. 0.06 erhöht (entspricht ca. 40px bei figsize 7)
fig_top = 0.81    # Um ca. 0.06 erhöht, um die Höhe des Plots beizubehalten
plt.subplots_adjust(left=fig_left, bottom=fig_bottom, top=fig_top, right=fig_right)

# Initialisierung der Plot-Elemente
func_line, = ax.plot(t_values, position_values, color='lightgray', label='Ort x(' \
't)', linewidth=3)
tangent_line, = ax.plot([], [], color='purple', label='', ls='dotted', linewidth=1.5)
point, = ax.plot([], [], 'ro', label='')
secant_line, = ax.plot([], [], 'g--', label='', linewidth=1.5)
p1_dot, = ax.plot([], [], 'go')
p2_dot, = ax.plot([], [], 'go')
sec_triangle_v, = ax.plot([], [], 'g', linewidth=1)
sec_triangle_h, = ax.plot([], [], 'g', linewidth=1)
dt_text = ax.text(0, 0, '', color='green', fontsize=9)
dx_text_sec = ax.text(0, 0, '', color='green', fontsize=9)

ax.set_xlim(t_min, t_max)
ax.set_xlabel("Zeit t / s")
ax.set_ylabel("Ort x / m")
ax.grid(True)


# --- Widgets ---

# Position für Checkbuttons (Links oben, unterhalb des Titels)
check_btn_y_start = 0.85 # Start y-Position für Checkbuttons (bleibt über fig_top)
check_btn_height = 0.07 # Höhe eines Checkbuttons
ax_check1 = plt.axes([0.05, check_btn_y_start, 0.12, check_btn_height])
check_tan = CheckButtons(ax_check1, ['Tangente'], [False])

# Dynamische X-Positionierung für nachfolgende Checkbuttons
ax_check2_x = ax_check1.get_position().x1 + 0.02 # 0.02 Abstand zum vorherigen
ax_check2 = plt.axes([ax_check2_x, check_btn_y_start, 0.2, check_btn_height])
check_tri = CheckButtons(ax_check2, ['Steigungsdreieck'], [False])

ax_check3_x = ax_check2.get_position().x1 + 0.02
ax_check3 = plt.axes([ax_check3_x, check_btn_y_start, 0.15, check_btn_height])
check_mode = CheckButtons(ax_check3, ['Zentriert'], [True])

# Position für RadioButtons (Rechts oben, unterhalb des Titels)
radio_btn_y_start = 0.85 # Start y-Position für RadioButtons (bleibt über fig_top)
radio_btn_height = 0.08
ax_radio = plt.axes([0.70, radio_btn_y_start, 0.25, radio_btn_height])
func_labels = ('Gerade', 'Parabel', 'Komplex')
radio_func = RadioButtons(ax_radio, func_labels, active=0)


# Berechne die Position und Breite der Slider relativ zum Plotbereich
ax_pos = ax.get_position() # Aktuelle Position des Hauptdiagramms (wird nach plt.subplots_adjust neu berechnet)
plot_width_for_sliders = ax_pos.width # Die tatsächliche Breite der Plot-Achsen
slider_relative_width = 0.6 # 60% der Plotbreite
slider_abs_width = slider_relative_width * plot_width_for_sliders

# Linke Position berechnen, um Slider horizontal zu zentrieren unter dem Plot
slider_left = ax_pos.x0 + (ax_pos.width - slider_abs_width) / 2

# Topmost slider (t am Stützpunkt)
# Diese Positionen bleiben wie in der vorherigen Version, da sie "fix" sind
slider_i_bottom = 0.10
slider_height = 0.03
ax_i = plt.axes([slider_left, slider_i_bottom, slider_abs_width, slider_height])
slider_i = Slider(ax=ax_i, label='t / s am Stützpunkt', valmin=100, valmax=len(t_values)-100-1, valinit=i0, valstep=1)

# Lower slider (Delta t)
slider_d_bottom = 0.05
ax_d = plt.axes([slider_left, slider_d_bottom, slider_abs_width, slider_height])
slider_d = Slider(ax=ax_d, label='Delta t / s', valmin=-2000, valmax=2000, valinit=delta_index_initial, valstep=10)


# Erläuterungstextbox ist nun komplett entfernt


# --- Funktionen zur Aktualisierung ---

def update_legend(t0, x0_pos):
    # Aktualisiert die Legende basierend auf sichtbaren Elementen
    handles = [func_line, point]
    labels = ['Ort x(t)', f'Stützpunkt (t={t0:.2f}s, x={x0_pos:.2f}m)']
    if show_tangent and tangent_line.get_visible():
        handles.append(tangent_line)
        labels.append(tangent_line.get_label())
    if show_triangle and secant_line.get_visible():
        handles.append(secant_line)
        labels.append(secant_line.get_label())
    ax.legend(handles, labels, loc='upper left')

def change_function(label):
    # Wird aufgerufen, wenn eine neue Funktion über RadioButtons ausgewählt wird
    global position_values, velocity_values, position_min, position_max

    t = t_values

    if label == func_labels[2]: # Funktion 3 (Komplex)
        position_values = (1/1000 * (-4*(t+2)**2 - 4*(t+2) - 20) * np.sin(t))
    elif label == func_labels[0]: # Funktion 1 (Gerade) -> Gleichförmige Bewegung
        position_values = 2*t - 5
    elif label == func_labels[1]: # Funktion 2 (Parabel, Min bei (5, 1)) -> Gleichmäßig beschleunigte Bewegung
        position_values = (t - 5)**2 + 1

    # Geschwindigkeit (Ableitung des Ortes nach der Zeit) neu berechnen
    velocity_values = np.gradient(position_values, t_values)

    # Die geplottete Kurve aktualisieren
    func_line.set_ydata(position_values)

    # Plotgrenzen neu berechnen und setzen (Robusteres Padding)
    position_min_data, position_max_data = np.min(position_values), np.max(position_values)
    position_range_data = position_max_data - position_min_data

    min_absolute_pad = 0.5 # Stellen Sie sicher, dass immer ein sichtbares Padding vorhanden ist
    position_pad = max(0.1 * position_range_data, min_absolute_pad)

    position_min = position_min_data - position_pad
    position_max = position_max_data + position_pad
    ax.set_ylim(position_min, position_max)

    # Die Tangenten/Sekanten-Berechnung anstoßen
    update()

def update(val=None):
    # Haupt-Update-Funktion für Slider/Checkboxes
    global show_tangent, show_triangle, centered_mode

    # Sicherstellen, dass die Daten existieren (wichtig beim Start)
    if position_values is None or velocity_values is None:
        return

    i = int(slider_i.val)
    delta_index = int(slider_d.val) # Delta ist jetzt ein Index-Delta

    # Aktualisiere den Slider-Label für 't (s) am Stützpunkt'
    slider_i.label.set_text(f't / s am Stützpunkt: {t_values[i]:.2f}')
    # Aktualisiere den Slider-Label für 'Delta t (s)'
    slider_d.label.set_text(f'Delta t / s: {delta_index * (t_values[1] - t_values[0]):.2f}')


    if delta_index == 0:
        # Bei Delta t = 0 ist die Sekante nicht definiert, zeige nur Tangente falls gewünscht
        # oder zeige nur den Punkt.
        # Hier deaktivieren wir die Sekanten-Darstellung explizit
        secant_line.set_visible(False)
        p1_dot.set_visible(False)
        p2_dot.set_visible(False)
        sec_triangle_v.set_visible(False)
        sec_triangle_h.set_visible(False)
        dt_text.set_visible(False)
        dx_text_sec.set_visible(False)
        # Tangente und Punkt sollten weiterhin korrekt funktionieren
        t0 = t_values[i]
        x0_pos = position_values[i]
        v_inst = velocity_values[i]

        if show_tangent:
            t_tangent_plot = np.linspace(t_min, t_max, 100)
            x_tangent_plot = v_inst * (t_tangent_plot - t0) + x0_pos
            tangent_line.set_data(t_tangent_plot, x_tangent_plot)
            tangent_line.set_label(f'Tangente bei t = {t0:.2f} s; v = {v_inst:.3f} m/s')
            tangent_line.set_visible(True)
        else:
            tangent_line.set_visible(False)

        point.set_data([t0], [x0_pos])
        point.set_label(f'Stützpunkt bei t = {t0:.2f} s, x = {x0_pos:.2f} m')
        point.set_visible(True)

        update_legend(t0, x0_pos)
        fig.canvas.draw_idle()
        return


    # Berechnung der Punkte für die Sekante
    if centered_mode:
        # Stützpunkt in der Mitte
        i1 = i - delta_index
        i2 = i + delta_index
        if i1 < 0 or i2 >= len(t_values):
            return
        t0 = t_values[i]
        x0_pos = position_values[i]
        t1 = t_values[i1]
        x1_pos = position_values[i1]
        t2 = t_values[i2]
        x2_pos = position_values[i2]
    else:
        # Stützpunkt als erster Punkt (linker Punkt)
        i2 = i + delta_index
        if i2 < 0 or i2 >= len(t_values):
            return
        t0 = t_values[i] # Stützpunkt für die Tangente bleibt t_values[i]
        x0_pos = position_values[i]
        t1 = t_values[i]  # Erster Punkt der Sekante ist der Stützpunkt
        x1_pos = position_values[i]
        t2 = t_values[i2]
        x2_pos = position_values[i2]


    dt_val = t2 - t1
    dx_val = x2_pos - x1_pos
    v_avg = dx_val / dt_val if dt_val != 0 else np.nan # Durchschnittsgeschwindigkeit
    v_inst = velocity_values[i] # Momentangeschwindigkeit

    # Tangente
    if show_tangent:
        t_tangent_plot = np.linspace(t_min, t_max, 100)
        x_tangent_plot = v_inst * (t_tangent_plot - t0) + x0_pos
        tangent_line.set_data(t_tangent_plot, x_tangent_plot)
        tangent_line.set_label(f'Tangente bei t = {t0:.2f} s; v = {v_inst:.3f} m/s')
        tangent_line.set_visible(True)
    else:
        tangent_line.set_visible(False)

    point.set_data([t0], [x0_pos])
    point.set_label(f'Stützpunkt bei t = {t0:.2f} s, x = {x0_pos:.2f} m')
    point.set_visible(True)

    # Steigungsdreieck (Sekante)
    if show_triangle:
        t_sec_plot = np.linspace(t_min, t_max, 100)
        x_sec_plot = v_avg * (t_sec_plot - t1) + x1_pos
        secant_line.set_data(t_sec_plot, x_sec_plot)
        secant_line.set_label(f'Sekante: Durchschnittsgeschwindigkeit v̄ = {v_avg:.3f} m/s')
        secant_line.set_visible(True)

        p1_dot.set_data([t1], [x1_pos])
        p2_dot.set_data([t2], [x2_pos])
        p1_dot.set_visible(True)
        p2_dot.set_visible(True)

        sec_triangle_h.set_data([t1, t2], [x1_pos, x1_pos])
        sec_triangle_v.set_data([t2, t2], [x1_pos, x2_pos])
        sec_triangle_v.set_visible(True)
        sec_triangle_h.set_visible(True)

        # Positionierung der Δt/Δx Texte (angepasst für bessere Lesbarkeit)
        dt_text.set_position(((t1 + t2)/2, x1_pos + 0.02*(position_max - position_min)))
        dt_text.set_text(f"Δt = {dt_val:.2f} s")
        dt_text.set_visible(True)
        dt_text.set_horizontalalignment('center')

        dx_t_pos = t2 + 0.01*(t_max - t_min)
        dx_text_sec.set_verticalalignment('center')
        dx_text_sec.set_horizontalalignment('left')

        if t2 > t_max * 0.9: # Wenn zu nah am rechten Rand, Text links von Punkt t2
             dx_t_pos = t2 - 0.01*(t_max - t_min)
             dx_text_sec.set_horizontalalignment('right')
        elif t2 < t_min + 0.1*(t_max - t_min): # Wenn zu nah am linken Rand, Text rechts von Punkt t2
            dx_t_pos = t2 + 0.01*(t_max - t_min)
            dx_text_sec.set_horizontalalignment('left')

        dx_text_sec.set_position((dx_t_pos, (x1_pos + x2_pos)/2))
        dx_text_sec.set_text(f"Δx = {dx_val:.2f} m")
        dx_text_sec.set_visible(True)
    else:
        secant_line.set_visible(False)
        p1_dot.set_visible(False)
        p2_dot.set_visible(False)
        sec_triangle_v.set_visible(False)
        sec_triangle_h.set_visible(False)
        dt_text.set_visible(False)
        dx_text_sec.set_visible(False)

    update_legend(t0, x0_pos)
    fig.canvas.draw_idle()

# --- Toggle Funktionen ---
def toggle_tangent(label):
    global show_tangent
    show_tangent = not show_tangent
    update()

def toggle_triangle(label):
    global show_triangle
    show_triangle = not show_triangle
    update()

def toggle_mode(label):
    global centered_mode
    centered_mode = not centered_mode
    update()

# --- Event Handler verbinden ---
slider_i.on_changed(update)
slider_d.on_changed(update)
check_tan.on_clicked(toggle_tangent)
check_tri.on_clicked(toggle_triangle)
check_mode.on_clicked(toggle_mode)
radio_func.on_clicked(change_function)

# --- Initialisierung ---
# Wir starten den Plot, indem wir die erste Funktion laden
change_function(func_labels[0])

plt.show()