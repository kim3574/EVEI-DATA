import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import tkinter as tk
from tkinter import filedialog

class EVEIApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Data Visualization App")

        self.frames = {}

        for F in (StartPage, MCPage, PhysicsBoxPage):
            frame = F(parent=root, controller=self)
            self.frames[F] = frame
            frame.grid(row=0, column=0, sticky="nsew")

        self.show_frame(StartPage)

    def show_frame(self, cont):
        frame = self.frames[cont]
        frame.tkraise()
        self.root.geometry(frame.size)


class StartPage(tk.Frame):
    size = "1000x600"

    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        self.controller = controller

        center_frame = tk.Frame(self)
        center_frame.pack(expand=True)

        center_frame.grid_rowconfigure(0, weight=1)
        center_frame.grid_rowconfigure(2, weight=1)
        center_frame.grid_columnconfigure(0, weight=1)

        button_width = 20

        load_MC_button = tk.Button(center_frame, text="Motor Control (MC)", font=('Helvetica', 18), width=button_width,
                                   command=lambda: controller.show_frame(MCPage))
        load_MC_button.grid(row=1, column=0, pady=10)

        load_PhysicsBox_button = tk.Button(center_frame, text="Physics Box", font=('Helvetica', 18), width=button_width,
                                           command=lambda: controller.show_frame(PhysicsBoxPage))
        load_PhysicsBox_button.grid(row=1, column=1, pady=10)



class MCPage(tk.Frame):

    size = "1000x1100"

    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        self.controller = controller

        back_to_selection_button = tk.Button(self, text="Back to File Selection",
                                             command=lambda: controller.show_frame(StartPage))
        back_to_selection_button.pack(side=tk.TOP, pady=10)

        load_MC_button = tk.Button(self, text="Load MC Excel File", font=('Helvetica', 18),
                                   command=self.load_file)
        load_MC_button.pack(pady=30)
    def go_back(self):
        self.controller.show_frame(StartPage)


    def load_file(self):
        file_path = filedialog.askopenfilename()
        if file_path:
            data = pd.read_excel(file_path, skiprows=4, engine='openpyxl')
            self.plot_hobart_data(data)


    def plot_hobart_data(self, data):
        data['Battery Power'] = data['Battery Voltage'] * data['Battery Current']
        data['Motor Power'] = data['Motor Voltage'] * data['Motor Current']

        # Calculate the maximum and average values with rounding
        max_temp = round(data['M- Temperature'].max(), 3) if 'M- Temperature' in data else 'N/A'
        max_power_consumption = round(data['Motor Power'].max(), 3) if 'Motor Power' in data else 'N/A'
        average_temp = round(data['M- Temperature'].mean(), 3) if 'M- Temperature' in data else 'N/A'
        average_power_consumption = round(data['Motor Power'].mean(), 3) if 'Motor Power' in data else 'N/A'

        # Identify the time of rapid drop in power consumption
        power_drop = data['Motor Power'].diff().idxmin()
        time_of_drop = round(data.loc[power_drop, 't'], 3) if power_drop != None and 't' in data.columns else 'N/A'


        # Clear previous widgets
        for widget in self.winfo_children():
            widget.destroy()
        container = tk.Frame(self)
        container.pack(fill='both', expand=True)      
        # Create a container frame
        container = tk.Frame(self)
        container.pack(side=tk.TOP, fill='both', expand=True)

        # Create a frame for the plot
        plot_frame = tk.Frame(container)
        plot_frame.pack(side='left', fill='both', expand=True)

        # Plot the graph in 2x2 grid
        fig, axs = plt.subplots(2, 2, figsize=(7,7))       


        # Motor Power Consumption
        axs[0, 0].plot(data['t'], data['Motor Power'], label='Motor Power Consumption')
        axs[0, 0].set_title('Motor Power Consumption vs t')
        axs[0, 0].set_xlabel('Time (t)')
        axs[0, 0].set_ylabel('Power Consumption')
        axs[0, 0].grid(True)
        axs[0, 0].legend()

        # Motor Temperature
        axs[0, 1].plot(data['t'], data['M- Temperature'], label='M- Temperature', color='r')
        axs[0, 1].set_title('M- Temperature vs t')
        axs[0, 1].set_xlabel('Time (t)')
        axs[0, 1].set_ylabel('Temperature')
        axs[0, 1].grid(True)
        axs[0, 1].legend()

        # Battery Power Consumption
        axs[1, 0].plot(data['t'], data['Battery Power'], label='Battery Power Consumption')
        axs[1, 0].set_title('Battery Power Consumption vs t')
        axs[1, 0].set_xlabel('Time (t)')
        axs[1, 0].set_ylabel('Power Consumption')
        axs[1, 0].grid(True)
        axs[1, 0].legend()

        # Battery Temperature
        axs[1, 1].plot(data['t'], data['B+ Temperature'], label='B+ Temperature', color='g')
        axs[1, 1].set_title('B+ Temperature vs t')
        axs[1, 1].set_xlabel('Time (t)')
        axs[1, 1].set_ylabel('Temperature')
        axs[1, 1].grid(True)
        axs[1, 1].legend()
        

        canvas = FigureCanvasTkAgg(fig, plot_frame)
        canvas_widget = canvas.get_tk_widget()
        canvas_widget.pack(fill='both', expand=True)

        info_frame = tk.Frame(container)
        info_frame.pack(side='left', fill='both')

        # Define a larger font size for the label
        info_font = ('Helvetica', 14)  # Adjust the font size as needed

        info_text = (

            f"Average Temperature: {max_temp} degree(Celsius)\n"
            f"Average Temperature: {average_temp} degree(Celsius)\n"

            f"Maximum Power Consumption: {max_power_consumption} W\n"
            f"Average Power Consumption: {average_power_consumption} W\n"
            f"Time of Rapid Power Drop: {time_of_drop} s"
        )
        info_label = tk.Label(info_frame, text=info_text, justify='left', font=info_font)
        info_label.pack(side='top', fill='both', expand=True)

        # Back to selection button
        back_to_selection_button = tk.Button(self, text="Back to File Selection", command=self.go_back)
        back_to_selection_button.pack(side=tk.BOTTOM, pady=10)


class PhysicsBoxPage(tk.Frame):
    size = "1000x1100"

    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        self.controller = controller

        back_to_selection_button = tk.Button(self, text="Back to File Selection",
                                             command=lambda: controller.show_frame(StartPage))
        back_to_selection_button.pack(side=tk.TOP, pady=10)

        load_PhysicsBox_button = tk.Button(self, text="Load PhysicsBox Excel File", font=('Helvetica', 18),
                                           command=self.load_file)
        load_PhysicsBox_button.pack(pady=30)
    def go_back(self):
        self.controller.show_frame(StartPage)

    def load_file(self):
        file_path = filedialog.askopenfilename()
        if file_path:
            data = pd.read_excel(file_path, skiprows=2, engine='openpyxl')
            self.plot_physicsbox_data(data)

    def plot_physicsbox_data(self, data):
        # Clear previous widgets
        for widget in self.winfo_children():
            widget.destroy()

        back_to_selection_button = tk.Button(self, text="Back to File Selection", command=self.go_back)
        back_to_selection_button.pack(side=tk.TOP, pady=10)
        
        fig, axs = plt.subplots(2, 1, figsize=(7,7))


        # Power over time
        axs[0].plot(data['millis']/1000, data['Power(kW)'], label='Power over time')
        axs[0].set_title('Power over time')
        axs[0].set_xlabel('Time (s)')
        axs[0].set_ylabel('Power(kW)')
        axs[0].grid(True)
        axs[0].legend()

        # RPM over time
        axs[1].plot(data['millis'], data['RPM'], label='RPM over time', color='r')
        axs[1].set_title('RPM over time')
        axs[1].set_xlabel('Time (millis)')
        axs[1].set_ylabel('RPM')
        axs[1].grid(True)
        axs[1].legend()
        canvas = FigureCanvasTkAgg(fig, self)
        canvas_widget = canvas.get_tk_widget()
        canvas_widget.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

if __name__ == "__main__":
    root = tk.Tk()
    app = EVEIApp(root)
    root.mainloop()
