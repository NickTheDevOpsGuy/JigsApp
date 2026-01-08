.page {
  min-height: 100vh;
  background: #dff1ff;
  display: grid;
  grid-template-rows: auto 1fr;
}

.topBar {
  height: 56px;
  background: #7ec9ff;
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  align-items: center;
  padding: 0 12px;
}

.title {
  text-align: center;
  font-weight: 900;
  color: #0b2e52;
}

.iconBtn {
  height: 40px;
  width: 40px;
  justify-self: end;
  border-radius: 10px;
  border: 1px solid rgba(11, 99, 184, 0.25);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-weight: 800;
  color: #0b63b8;
}

.main {
  padding: 16px;
  display: grid;
  gap: 16px;
  align-content: start; /* top */
}

.board {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(11, 99, 184, 0.2);
  border-radius: 16px;
  min-height: 360px;
  display: grid;
  place-items: center;
}

.tray {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(11, 99, 184, 0.2);
  border-radius: 16px;
  min-height: 160px;
  display: grid;
  place-items: center;
}