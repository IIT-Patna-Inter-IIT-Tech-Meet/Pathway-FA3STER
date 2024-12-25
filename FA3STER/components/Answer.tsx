import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import generateSVG from "../public/img/svgs/generate.svg";
import gradeDocsSVG from "../public/img/svgs/grade_docs.svg";
import webSearchSVG from "../public/img/svgs/web_search.svg";
import transformQuerySVG from "../public/img/svgs/transform_query.svg";
import financeAgentSVG from "../public/img/svgs/finance_agent.svg";
import reasoningAgentSVG from "../public/img/svgs/reasoning_agent.svg";
import endSVG from "../public/img/svgs/end.svg";
import sqlAgentSVG from "../public/img/svgs/sql_agent.svg"
import retrieveSVG from "../public/img/svgs/retrieve.svg";
import startSVG from "../public/img/svgs/start.svg";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import BeenhereIcon from "@mui/icons-material/Beenhere";

import { useRefreshContext } from "../context/VarContext";

import "./Answer.css";

import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { div } from "@/backend_server/venv/lib/python3.12/site-packages/bokeh/server/static/js/lib/core/dom";
import MarkdownDisplay from "./MarkdownDisplay";
const SOCKET_SERVER_URL = "http://localhost:7770"; // Update to your backend's URL

let i = 0;

export default function Answer({ answer }: { answer: string }) {
  const [messages, setMessages] = useState([]);
  const [subQueryArray, setSubQueryArray] = useState([]);
  // const [subQueryEnd, setSubQueryEnd] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [atNode, setAtNode] = useState("start");
  const [processedSubQueryArray, setProcessedSubQueryArray] = useState([]);
  const [SubQueryQueue, setSubQueryQueue] = useState([]);
  const [currentSubQuery, setCurrentSubQuery] = useState("");

  // const [time, setTime] = useState(0); // State to track the time
  // const [isRunning, setIsRunning] = useState(false);

  const { refreshVar, setrefreshVar } = useRefreshContext();

  const [subqueryNodeMap, setSubqueryNodeMap] = useState<Map<string, string[]>>(
    new Map(),
  );

  const [subqueryStatusMap, setSubqueryStatusMap] = useState<
    Map<string, string>
  >(new Map());

  const [handlingStatus, setHandlingStatus] = useState(false);

  const [isAllSubsProcessed, setIsAllSubsProcessed] = useState("nope");

  // Function to add new values to an existing key or create a new key
  const addValuesToKey = (key: string, newValues: string) => {
    setSubqueryNodeMap((prevMap) => {
      // Get the current values for the key (or an empty array if key doesn't exist)
      const currentValues = prevMap.get(key) || [];

      // Merge the current values with new values
      const updatedValues = [...currentValues, newValues];

      // Create a new Map with the updated values for the key
      return new Map(prevMap.set(key, updatedValues));
    });
  };

  const subqueryStatusMapSet = (key: string, newval: string) => {
    setSubqueryStatusMap((prevMap) => {
      // Get the current values for the key (or an empty array if key doesn't exist)
      const currentValues = prevMap.get(key) || [];

      // Create a new Map with the updated values for the key
      return new Map(prevMap.set(key, newval));
    });
  };

  useEffect(() => {
    if (refreshVar == "ready") {
      setSubqueryNodeMap(new Map());
      setSubqueryStatusMap(new Map());
      setAnswer2("");
      setHandlingStatus(false);
      setIsAllSubsProcessed("nope");
      setSubQueryArray([]);
    }
    if (refreshVar == "stoppedResponse") {
      setSubqueryNodeMap(new Map());
      setSubqueryStatusMap(new Map());
      setAnswer2("");
      setHandlingStatus(false);
      setIsAllSubsProcessed("nope");
      setSubQueryArray([]);
    }
  }, [refreshVar]);

  useEffect(() => {
    // let interval: NodeJS.Timeout | null = null;
    // if (isRunning) {
    //   interval = setInterval(() => {
    //     setTime((prevTime) => prevTime + 1); // Increment time by 1 every second
    //   }, 1000); // Update every 1000 ms (1 second)
    // } else if (!isRunning && time !== 0) {
    //   if (interval) clearInterval(interval); // Clear the interval when the stopwatch stops
    // }

    // Connect to the Socket.IO server
    const socket = io(SOCKET_SERVER_URL);

    // Listen for messages from the backend
    socket.on("message_to_frontend_subquery_array", (data) => {
      // setIsRunning(true);
      data = JSON.parse(data);
      setSubQueryArray(data);
      // setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("message_to_frontend_subquery_start", (data) => {
      const sub_query = JSON.parse(data);

      subqueryStatusMapSet(sub_query, "loading");

      setCurrentSubQuery(data);
      // setMessages((prevMessages) => [...prevMessages, data]);
      setSubQueryQueue((prevStack) => [...prevStack, data]);
    });

    socket.on("message_to_frontend_subquery_end", (data) => {
      data = JSON.parse(data);

      const { sub_query } = data;

      subqueryStatusMapSet(sub_query, "done");

      setSubQueryQueue((prevQueue) => {
        if (prevQueue.length > 0) {
          const [firstElement, ...restQueue] = prevQueue; // Destructure to remove the first element

          // Ensure the firstElement is not already in the ProcessedSubQueryArray
          setProcessedSubQueryArray((prevArray) => {
            if (!prevArray.includes(firstElement)) {
              return [...prevArray, firstElement]; // Add only if it's not already added
            }
            return prevArray;
          });

          return restQueue; // Return the queue without the first element
        } else {
          return prevQueue; // Return the unchanged queue if it's empty
        }
      });

      // setProcessedSubQueryArray((pq) =>[...pq, data]);
    });

    socket.on("message_to_frontend_atnode", (data) => {
      setHandlingStatus(true);
      data = JSON.parse(data);

      console.log("xxxx", data);

      const { sub_query, node } = data;

      setAtNode(node);
      setMessages((prevMessages) => [...prevMessages, data]);
      addValuesToKey(sub_query, node);
    });

    socket.on("message_to_frontend_answer", (data) => {
      setIsAllSubsProcessed("generatedAnswer");
      // setIsRunning(false);
      data = JSON.parse(data);
      setrefreshVar("generated");
      setAtNode("start");
      setAnswer2(data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("message_to_frontend_all_subs_processed", (data) => {
      setIsAllSubsProcessed("done");
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.disconnect();
      // if (interval) clearInterval(interval); // Clean up the interval on component unmount
    };
  }, []);

  const arr = [
    startSVG,
    webSearchSVG,
    generateSVG,
    transformQuerySVG,
    retrieveSVG,
    gradeDocsSVG,
    financeAgentSVG,
    reasoningAgentSVG,
    endSVG,sqlAgentSVG,
  ];

  const [myMap, setMyMap] = useState<{ [key: string]: any }>({
    start: startSVG,
    web_search: webSearchSVG,
    generate: generateSVG,
    transform_query: transformQuerySVG,
    retrieve: retrieveSVG,
    grade_documents: gradeDocsSVG,
    finance_agent: financeAgentSVG,
    reasoning_agent: reasoningAgentSVG,
    end: endSVG,
    sql_agent: sqlAgentSVG,
  });

  const [ctr, setCounter] = useState(0);

  const markdown = `A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |
`;

  return (
    <div className="mx-auto my-24 flex h-auto w-[90%] shrink-0 flex-col gap-4 rounded-3xl bg-[#212121] p-5 lg:p-10">
      <div className="flex justify-between gap-5">
        <Image src={myMap[atNode]} height={700} alt="please try again" />

        <div className="flex flex-col">
          <div className="h-[700px] w-[700px] overflow-y-auto">
            <p className="font-bol mb-2 mt-4 text-xl text-[#dddddd]">
              {" "}
              Sub Queries to be Handled
            </p>

            {subQueryArray.map((query, ind) => (
              <p key={ind} className="text-[#aaaaaa]">
                {query}
              </p>
            ))}

            <p className="my-5 mb-2 text-xl font-bold text-[#dddddd]">
              {" "}
              Handling
            </p>
            {!handlingStatus ? (
              <div id="loader"></div>
            ) : (
              <>
                <div>
                  {Array.from(subqueryNodeMap.entries()).map(
                    ([key, values]) => (
                      <div key={key} className="my-3 flex text-[#aaaaaa]">
                        <div className="flex flex-col">
                          <div>{key}</div>
                          {/* <div>{values.join(", ")}</div> */}

                          <div className="my-1 flex gap-2">
                            {values.map((val, index) => (
                              <div
                                key={index}
                                className="rounded-2xl bg-black p-1 px-3 text-white"
                              >
                                {val}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mx-5 p-1">
                          {subqueryStatusMap.get(key) == "done" ? (
                            <BeenhereIcon className="text-green-500" />
                          ) : null}

                          {subqueryStatusMap.get(key) == "loading" ? (
                            <div id="loader"></div>
                          ) : null}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-12 flex">
                  {isAllSubsProcessed == "done" && (
                    <div className="flex w-[200px] rounded-2xl bg-black p-2 px-4 text-yellow-300">
                      Merging Answers
                    </div>
                  )}

                  {isAllSubsProcessed == "generatedAnswer" && (
                    <div className="flex w-[200px] rounded-2xl bg-black p-2 px-4 text-green-300">
                      Merged
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* <div className="my-10 h-[400px] w-[700px] overflow-y-auto">
            ``
            <div className="flex items-center justify-between pb-3">
              <div className="flex gap-4">
                <Image
                  unoptimized
                  src="/img/Info.svg"
                  alt="footer"
                  width={24}
                  height={24}
                  className="block lg:hidden"
                />
                <h3 className="text-base font-bold uppercase text-black">
                  Answer:{" "}
                </h3>
              </div>
              {answer && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(answer2);
                      toast("Answer copied to clipboard", {
                        icon: "✂️",
                      });
                    }}
                  >
                    <Image
                      unoptimized
                      src="/img/copy.svg"
                      alt="footer"
                      width={20}
                      height={20}
                      className="cursor-pointer"
                    />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap content-center items-center gap-[15px]">
              <div className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-black">
                {answer2 && refreshVar == "generated" ? (
                  answer2
                ) : (
                  <>
                    <div className="flex w-full flex-col gap-2">
                      <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                      <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                      <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                      <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div> */}
        </div>
      </div>
      <div className="m-auto my-10 w-[90%] rounded-3xl bg-black p-7">
        <div className="mb-10 flex items-center justify-between pb-3">
          <div className="flex gap-4">
            <Image
              unoptimized
              src="/img/Info.svg"
              alt="footer"
              width={24}
              height={24}
              className="block lg:hidden"
            />
            <h3 className="text-[20px] text-base font-bold uppercase text-[#dddddd]">
              Answer:{" "}
            </h3>
          </div>
          {answer2 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer2.trim());
                  toast("Answer copied to clipboard", {
                    icon: "✂️",
                    style: { backgroundColor: "black", color: "white" },
                  });
                }}
              >
                <Image
                  unoptimized
                  src="/img/copy.svg"
                  alt="footer"
                  width={20}
                  height={20}
                  className="cursor-pointer"
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap content-center items-center gap-[15px]">
          <div className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-[#aaaaaa]">
            {answer2 ? (
              <MarkdownDisplay content={answer2} />
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-md bg-[#373636]" />
                <div className="h-6 w-full animate-pulse rounded-md bg-[#373636]" />
                <div className="h-6 w-full animate-pulse rounded-md bg-[#373636]" />
                <div className="h-6 w-full animate-pulse rounded-md bg-[#373636]" />
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{ duration: 700 }}
      />
    </div>
  );
}
