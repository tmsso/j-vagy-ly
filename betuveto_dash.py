from pathlib import Path
import random
from dash import Dash, html, dcc, Input, Output, State

# Initialize
app = Dash(__name__)
wordlist_path = Path("data/magyar-szavak.txt")
word_length = 7
word_list = []
correct_guesses = []
input_word = " "
new_word = True
total_score = 0

# Load word list
with wordlist_path.open("r") as file:
    word_list = [line.strip() for line in file]

# Select new word
if new_word:
    random_word = random.choice([w for w in word_list if len(w)==word_length]).upper()
    random_letters = ' '.join(sorted(random_word))
    correct_guesses.clear()
    new_word = False

# App layout
app.layout = html.Div([
    html.H1("Betűvető"),
    html.Div(f"Milyen szó rakható ki a következő betűkből: {random_letters}"),
    
    dcc.Input(id="user_input", type="text", placeholder="tipp"),
    html.Button("Mehet", id="submit_button", n_clicks=0),

    html.Div(id="feedback", style={"marginTop", "20px"})
])

@app.callback(
    Output(component_id="feedback", component_property="children"),
    Input(component_id="user_input", component_property="value")
)
def check_word(input_word):
    if len(input_word) == 1: 
        return(f"A teljes szó a következő volt:{random_word}")
        new_word = True
    if input_word not in word_list:
        return(f"Nem ismerek ilyen szót: {input_word}")
    elif can_form_word(input_word, random_word) and input_word in correct_guesses:
        return(f'Ezért a szóért már kaptál pontot. Pontszámod továbbra is {total_score}.')
    elif can_form_word(input_word, random_word):
        correct_guesses.append(input_word)
        current_score = len(input_word) ** 2
        total_score += current_score
        return(f"Helyes! {current_score} pont, összesen eddig {total_score}.")
    else:
        return(f"Ezekből a betűkből nem rakható ki {input_word}.")

def can_form_word(this_word, from_word):
    for c in this_word.upper():
        if from_word.upper().count(c) < this_word.upper().count(c):
            return False
    return True
    


              
              

if __name__ == "__main__":
    app.run_server(debug=True)