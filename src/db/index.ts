import neo4j from 'neo4j-driver';

const url = process.env.URL as string;
const user = process.env.USER as string;
const password = process.env.PASSWORD as string;

const driver = neo4j.driver(url, neo4j.auth.basic(user, password));

const session = driver.session();

export default session;