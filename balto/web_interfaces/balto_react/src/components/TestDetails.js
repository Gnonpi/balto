import "react-diff-view/index.css";

import PropTypes from "prop-types";
import React, { Component } from "react";
import { Card } from "react-bulma-components";
import { Icon } from "react-bulma-components/full";
import {
  Diff,
  addStubHunk,
  expandFromRawCode,
  parseDiff
} from "react-diff-view";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Subscribe } from "unstated";

import {
  faBan,
  faCheckCircle,
  faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { state } from "../state";
import { convert, convert_at_power } from "../time";

class SuiteViewer extends Component {
  static propTypes = {
    id: PropTypes.string
  };

  render() {
    return <p>Suite: {this.props.id}</p>;
  }
}

class FileViewer extends Component {
  static propTypes = {
    id: PropTypes.string
  };

  render() {
    return (
      <p>
        File: {this.props.id} of suite {this.props.suite}
      </p>
    );
  }
}

export class TestViewer extends Component {
  static propTypes = {
    id: PropTypes.string,
    test: PropTypes.object,
    suite: PropTypes.string
  };

  render() {
    let test = this.props.test;

    let tablist = [];
    let tabcontent = [];

    if (test.error && test.error.humanrepr) {
      tablist.push(
        <Tab>
          <a>Traceback</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.error.humanrepr}</pre>
        </TabPanel>
      );
    }

    if (test.error && test.error.diff && test.error.diff.diff) {
      /*      const paddingMetaInfo = "diff --git a/a b/b";
      const paddingIndexInfo = "index 1111111..2222222 100644";
      const diffBody = formatLines(
        diffLines(test.error.diff.expected, test.error.diff.got)
      );
      const diffText = [paddingMetaInfo, paddingIndexInfo, diffBody].join("\n");
      var result = parseDiff(diffText);
      console.log("RESULT", result);*/

      tablist.push(
        <Tab>
          <a>Diff</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.error.diff.diff}</pre>
        </TabPanel>
      );
    }

    if (test.stdout) {
      tablist.push(
        <Tab>
          <a>Stdout</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.stdout}</pre>
        </TabPanel>
      );
    }

    if (test.stderr) {
      tablist.push(
        <Tab>
          <a>Stderr</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.stderr}</pre>
        </TabPanel>
      );
    }

    if (test.logs) {
      tablist.push(
        <Tab>
          <a>Logs</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.logs}</pre>
        </TabPanel>
      );
    }

    let status_icon = null;

    if (test.outcome === "passed") {
      status_icon = (
        <Icon onClick={this.props.handleChange}>
          <FontAwesomeIcon icon={faCheckCircle} style={{ color: "green" }} />
        </Icon>
      );
    } else if (test.outcome === "failed") {
      status_icon = (
        <Icon onClick={this.props.handleChange}>
          <FontAwesomeIcon icon={faTimesCircle} style={{ color: "red" }} />
        </Icon>
      );
    } else if (test.outcome === "skipped") {
      status_icon = (
        <Icon onClick={this.props.handleChange}>
          <FontAwesomeIcon icon={faBan} style={{ color: "blue" }} />
        </Icon>
      );
    }

    var duration = undefined;
    if (test.duration !== undefined) {
      let convertedDuration = convert(test.duration);
      duration = (
        <span>
          Duration{" "}
          {convertedDuration.value.toFixed(convertedDuration.precision)}{" "}
          {convertedDuration.unit}
        </span>
      );
    }

    if (test.durations !== undefined) {
      let data = [];

      let min_timing = Math.min(...Object.values(test.durations));
      let converted_timing = convert(min_timing);
      console.log("Min timing", min_timing, converted_timing);

      for (let [key, value] of Object.entries(test.durations)) {
        let new_timing = convert_at_power(value, converted_timing.power).toFixed(converted_timing.precision);
        data.push({ name: key, timing: parseFloat(new_timing) });
      }

      tablist.push(
        <Tab>
          <a>Timings</a>
        </Tab>
      );

      let name = "timing in " + converted_timing.unit

      tabcontent.push(
        <TabPanel>
          <ResponsiveContainer width='100%' aspect={4.0 / 3.0}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="timing" name={name} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </TabPanel>
      );
    }


    return (
      <Card>
        <Card.Header>
          <Card.Header.Title>
            {test.test_name} {status_icon}
          </Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <h2>{this.props.suite}</h2>

          <h3>
            File: {test.file}, line {test.line}
          </h3>
          <h3>{duration}</h3>
          <h3>Last updated: {test.last_updated.fromNow()}</h3>
          <p>
            Test: {this.props.id} of suite {this.props.suite}
          </p>
          {tablist.length > 0 && (
            <Tabs selectedTabClassName="is-active">
              <div
                className="tabs is-boxed is-fullwidth"
                style={{ marginBottom: "0px" }}
              >
                <TabList>{tablist}</TabList>
              </div>
              {tabcontent}
            </Tabs>
          )}
        </Card.Content>
      </Card>
    );
  }
}

export function treenodeViewerComponent(id) {
  if (id === undefined) {
    return null;
  }

  let decoded = JSON.parse(id);
  let _type = decoded._type;
  let _id = decoded.id;

  if (_type === "suite") {
    return <SuiteViewer {...decoded} />;
  } else if (_type === "file") {
    return <FileViewer {...decoded} />;
  } else if (_type === "test") {
    return (
      <Subscribe to={[state]}>
        {state => <TestViewer test={state.state.tests[_id]} id={_id} suite={decoded.suite} />}
      </Subscribe>
    );
  }

  return <p>{id}</p>;
}
