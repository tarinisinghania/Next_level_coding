import React from "react"
import "./App.css"
import Scene from "./Scene"
import CustomCursor from "./CustomCursor"

function App() {
  return (
    <div
      className="App"
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        backgroundColor: "white",
      }}
    >
      <CustomCursor /> {/* 👈 add this line */}

      {/* Fixed Header Image */}
      <div className="header-image">
        {/* <img src="/src/header.png" alt="Header" /> */}
        <div
        style={{
          backgroundImage: 'url("/src/fullPage.png")',
          bachgroundColor: "black",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",
          width: "100vw",
          height: "906vh", // makes the div taller so you can scroll
          overflowY: "scroll",
        }}
      ></div>
        {/* <div className="title">
          <h1>Does the World Hate Your <br />Favorite Brands Now?</h1>
          <h2 className="sub-title">
            Companies like McDonald’s and Levi Strauss have long tapped <br />
            into America’s soft power to drive international sales. <br />
            But what was once a blessing is fast becoming a curse.
          </h2>
          <p className="third-title">September 16, 2025 at 5:30 AM EDT</p>
        </div> */}
      </div>

      <div className="orb-container"
      style={{
        position: "absolute",
        top: "200px",       // 👈 adjust this number
        left: "50%",
        transform: "translateX(-50%)",
        width: "100vw",
        height: "100vh", // make sure it covers the top section
        pointerEvents: "none", // so text below is still selectable
        zIndex: 2, // above background, below text if needed
      }}
      >
        <Scene />
      </div>
    </div>
  )
}

export default App
