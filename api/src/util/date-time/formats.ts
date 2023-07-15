import moment from "moment";

export function dateTime(date: any) {
  return moment(date).format("MMM D Y HH:mm:ss");
}

export function weekDateTime(date: any) {
  return moment(date).format("ddd MMM D Y HH:mm:ss");
}
