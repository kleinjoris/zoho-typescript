import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho: Zoho;

describe("Contact Tests", () => {
    beforeAll(async () => {
        const client = await ZohoApiClient.fromOAuth({
            orgId,
            client: {
                id: clientId,
                secret: clientSecret,
            },
        });
        zoho = new Zoho(client);
    });

    const contactIds: string[] = [];
    let createdContact: string;

    test("It should work to create a contact", async () => {
        const contactCreate = await zoho.contact.create({
            contact_persons: [
                {
                    first_name: "Test User",
                    last_name: "Lastname",
                },
            ],
            contact_name: "Test User Lastname",
            customer_sub_type: "individual",
            billing_address: {
                address: "Teststreet billing 101",
                zip: "90459",
                country: "Germany",
            },
            shipping_address: {
                address: "Teststreet shipping 101",
                zip: "90459",
                country: "Germany",
            },
        });
        contactIds.push(contactCreate.contact_id);
        createdContact = contactCreate.contact_id;

        expect(contactCreate.first_name).toBe("Test User");
        expect(contactCreate.contact_name).toBe("Test User Lastname");
    });

    let zohoAddressId :string;
    test("It should work to add an new address for a contact", async () => {
        zohoAddressId = await zoho.contact.addAddress(createdContact, {
            address: "New Address 44",
            city: "Nürnberg",
            zip: "90446",
            country: "Germany",
        });
    });
    test("It should work to update the address of an contact", async () => {
        const resp = await zoho.contact.updateAddress(createdContact, zohoAddressId, {
            address: "New Address 44",
            city: "Nürnberg",
            zip: "90446",
            country: "Germany",
        });
        expect(resp).toBeDefined();

    })

    test("It should work to get a certain contact", async () => {
        const contact = await zoho.contact.get(createdContact);

        expect(contact?.shipping_address.address).toBe(
            "Teststreet shipping 101",
        );
        expect(contact?.shipping_address.country_code).toBe("DE");
        expect(contact?.addresses[0].address).toBe("New Address 44");
        expect(contact?.contact_persons[0].first_name).toBe("Test User");
    });

    test("It should work to list all contacts", async () => {
        const contacts = await zoho.contact.list({});

        expect(contacts.length).toBeGreaterThan(0);
        expect(contacts[0].contact_id).toBeDefined;
        const searchForContact = contacts.find(
            (x) => x.contact_name === "Test User Lastname",
        );
        expect(searchForContact?.contact_id).toBeDefined();
    }, 10000);

    test("It should work to list all contacts with last modified time filter", async () => {
        const contacts = await zoho.contact.list({
            lastModifiedTime: new Date("2022-11-10T00:00:00+0100")
        });

        expect(contacts.length).toBeGreaterThan(0);
        expect(contacts[0].contact_id).toBeDefined;
        const searchForContact = contacts.find(
            (x) => x.contact_name === "Test User Lastname",
        );
        expect(searchForContact?.contact_id).toBeDefined();
    });

    test("It should work to list the contactpersons of a contact", async () => {
        const response = await zoho.contact.listContactPersons(contactIds[0]);
        expect(response.length).toBeGreaterThan(0);
    });

    test("It should work to update a contact", async () => {
        const updateContact = {
            contact_id: contactIds[0],
            contact_name: "Neuer Name"
        }
        const response = await zoho.contact.update(updateContact);
        expect(response.contact_name).toBe("Neuer Name")
    });

    test("It should work to delete a contact", async () => {
        await zoho.contact.delete(contactIds);
    });
});
