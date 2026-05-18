from __future__ import annotations

import random
from pathlib import Path

import streamlit as st

from app.pairs import generate_j_ly_pairs, load_words


DATA_PATH = Path("data/magyar-szavak.txt")


@st.cache_data(show_spinner=False)
def build_pairs() -> list[tuple[str, str]]:
    words = load_words(DATA_PATH)
    return generate_j_ly_pairs(words)


def _init_state() -> None:
    if "pairs" not in st.session_state:
        st.session_state.pairs = build_pairs()
    if "score_correct" not in st.session_state:
        st.session_state.score_correct = 0
    if "score_total" not in st.session_state:
        st.session_state.score_total = 0
    if "feedback" not in st.session_state:
        st.session_state.feedback = ""
    if "answered" not in st.session_state:
        st.session_state.answered = False
    if "current" not in st.session_state:
        st.session_state.current = random.choice(st.session_state.pairs)
    if "order" not in st.session_state:
        st.session_state.order = random.sample([0, 1], 2)


def _new_round() -> None:
    st.session_state.current = random.choice(st.session_state.pairs)
    st.session_state.order = random.sample([0, 1], 2)
    st.session_state.answered = False
    st.session_state.feedback = ""


def _answer(choice: str) -> None:
    if st.session_state.answered:
        return
    correct, wrong = st.session_state.current
    st.session_state.score_total += 1
    st.session_state.answered = True
    if choice == correct:
        st.session_state.score_correct += 1
        st.session_state.feedback = f"✅ Helyes! A jó alak: {correct}."
    else:
        st.session_state.feedback = (
            f"❌ Nem jó. A helyes alak: {correct}. (A másik opció: {wrong})"
        )


def main() -> None:
    st.set_page_config(page_title="J vagy LY?", page_icon="📝", layout="centered")
    _init_state()

    st.title("J vagy LY?")
    st.write("Válaszd ki a helyes írásmódot a két lehetőség közül.")

    total_pairs = len(st.session_state.pairs)
    st.caption(f"Elérhető feladatok száma: {total_pairs}")

    correct, wrong = st.session_state.current
    options = [correct, wrong]
    shown = [options[i] for i in st.session_state.order]

    cols = st.columns(2)
    with cols[0]:
        if st.button(shown[0], use_container_width=True):
            _answer(shown[0])
    with cols[1]:
        if st.button(shown[1], use_container_width=True):
            _answer(shown[1])

    if st.session_state.feedback:
        st.write(st.session_state.feedback)

    st.metric("Pontszám", f"{st.session_state.score_correct} / {st.session_state.score_total}")

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Következő szó", use_container_width=True):
            _new_round()
            st.rerun()
    with c2:
        if st.button("Új játék", use_container_width=True):
            st.session_state.score_correct = 0
            st.session_state.score_total = 0
            _new_round()
            st.rerun()


if __name__ == "__main__":
    main()
