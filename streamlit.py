from pathlib import Path
import random
import streamlit as st

word_length = 7


def main():

    wordlist_path = Path("data/magyar-szavak.txt")
    word_list = []
    correct_guesses = []
    input_word = " "
    new_word = True
    total_score = 0
    
    with wordlist_path.open("r") as file:
        word_list = [line.strip() for line in file]

    while input_word != "":
        if new_word:
            random_word = random.choice([w for w in word_list if len(w)==word_length]).upper()
            random_letters = ' '.join(sorted(random_word))
            correct_guesses.clear()
            new_word = False
        input_word = st.text_input(f"Milyen szó rakható ki a következő betűkből: {random_letters}? ").strip()
        submit_button = st.button(label = "OK")
        if submit_button:
            if input_word == "": break
            if len(input_word) == 1: 
                st.write(f"A teljes szó a következő volt:{random_word}")
                new_word = True
                continue
            if input_word not in word_list:
                st.warning(f"Nem ismerek ilyen szót: {input_word}")
            elif can_form_word(input_word, random_word) and input_word in correct_guesses:
                st.warning(f'Ezért a szóért már kaptál pontot. Pontszámod továbbra is {total_score}.')
            elif can_form_word(input_word, random_word):
                correct_guesses.append(input_word)
                current_score = len(input_word) ** 2
                total_score += current_score
                st.write(f"Helyes! {current_score} pont, összesen eddig {total_score}.")
            else:
                st.warning(f"Ezekből a betűkből nem rakható ki {input_word}.")
    st.write("Köszi a játékot!")

def can_form_word(this_word, from_word):
    for c in this_word.upper():
        if from_word.upper().count(c) < this_word.upper().count(c):
            return False
    return True
    


              
              

if __name__ == "__main__":
    main()