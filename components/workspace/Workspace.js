'use client';
import Split from "react-split";
import ProblemDesc from "../ProblemDesc";
import Playground from "./Playground";
import { useState } from "react";
import Confetti from "react-confetti";

const Workspace = ({ problem }) => {
	const [submitted, setSubmitted] = useState(false);

	return (
		<>
			{submitted && <Confetti gravity={0.3} tweenDuration={5000} />}
			<Split className="split px-1 h-[92vh] max-md:hidden" minSize={500}>
				<ProblemDesc problem={problem} />
				<Playground problem={problem} setSubmitted={setSubmitted} />
			</Split>
			<div className="md:hidden px-1">
				<ProblemDesc problem={problem} />
				<Playground problem={problem} setSubmitted={setSubmitted} />
			</div>
		</>
	);
};

export default Workspace;
