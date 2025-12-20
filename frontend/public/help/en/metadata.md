# OpenSincera Publisher Metadata Guide

<a id="publisher-id"></a>

### publisher_id

Unique identifier for the publisher in the OpenSincera system

---

<a id="publisher-name"></a>

### publisher_name

Display name of the publisher or website

---

<a id="owner-domain"></a>

### owner_domain

Owner domain as defined in ads.txt specification (OWNERDOMAIN). This should match the sellers.domain in the publisher's sellers.json entries and represents the Public Suffix List+1 format (e.g., example.com). It identifies the entity that owns the advertising inventory.

---

<a id="status"></a>

### status

Current operational status of the publisher account

---

<a id="verification-status"></a>

### verification_status

Verification level indicating the reliability of publisher information

---

<a id="last-updated"></a>

### last_updated

Date and time when the publisher information was last modified

---

<a id="contact-email"></a>

### contact_email

Email address for contacting the publisher

---

<a id="categories"></a>

### categories

Content categories or industry verticals associated with the publisher

---

<a id="description"></a>

### description

Description or summary of the publisher's content and services

---

<a id="primary-supply-type"></a>

### primary_supply_type

Primary type of advertising inventory supply (e.g., web, mobile, video)

---

<a id="avg-ads-to-content-ratio"></a>

### avg_ads_to_content_ratio

Ads to Content Ratio (A2CR) measures the percentage of the viewport that is dedicated to ads versus the percentage dedicated to content. The number shown is the max value found on the publisher.
A2CR is calculated when a Synthetic User visits a property or streaming channel and measures the total ad-renderable real estate (in pixels) as a percentage of the visible content. Synthetic Users scroll and interact with content to ensure the A2CR reflects the typical user experience.

Campaigns that run on high A2CR properties have significantly worse performance. By overloading the Ad Experience (and increasing A2CRs) publishers annoy users, but will risk being optimized off of a media plan.

---

<a id="avg-ads-in-view"></a>

### avg_ads_in_view

Ads in View tracks how many ads are "viewable" by the user. This number changes as the user scrolls through a webpage and the ad experience adjusts. Sincera provides initial, average, and maximum values to capture these changes.
As the Synthetic User scrolls the content on a URL, it notes how many ad units are in the viewport. Sincera takes this data and creates an average across multiple visits to the publisher.

Crowded ad environments hurt Click, Conversion, and Recall rates. Consumers find them off-putting, and buyers risk their message getting lost.

---

<a id="avg-ad-refresh"></a>

### avg_ad_refresh

Ad Refresh is the average of time, in seconds, an ad will display on a publisher before refreshing.
Sincera's Synthetic User will wait on a given URL and count the seconds between refresh events - a costly, but highly accurate way of determining ad refresh.

Fast ad refresh rates hurt campaign performance and carry reputational risk for publishers. Buyers should avoid running on these ad placements, and publishers should avoid blending fast-refreshing ad placements among overall slower refresh ad units.

---

<a id="total-unique-gpids"></a>

### total_unique_gpids

Total number of unique Global Publisher Identifiers (GPIDs) associated with the publisher.

GPIDs provide essential transparency and standardization across the programmatic advertising ecosystem. A higher number of unique GPIDs indicates better inventory organization and clearer supply chain visibility, enabling buyers to make more informed decisions and reducing the risk of fraud or misrepresented inventory.

---

<a id="id-absorption-rate"></a>

### id_absorption_rate

The Id Absorption Rate, a metric developed by Sincera, measures how effectively SSPs append identifiers to their outgoing bid requests. It focuses on the success rate when an identifier is already present, not the overall enrichment rate. A higher score indicates that a larger proportion of real-time bidding (RTB) traffic includes user identifiers.

Higher ID absorption rates enable more effective audience targeting and attribution while maintaining user privacy standards. This improves campaign performance for advertisers and increases revenue potential for publishers, creating a more efficient and sustainable advertising ecosystem.

---

<a id="avg-page-weight"></a>

### avg_page_weight

The average file size in MB for a given URL, which is a signal that inversely correlates with ad performance.

Heavy page weights slow down loading times and degrade user experience, leading to higher bounce rates and lower ad viewability. Publishers with optimized page weights create better user experiences, improve ad performance, and contribute to a more sustainable and user-friendly web ecosystem.

---

<a id="avg-cpu"></a>

### avg_cpu

The average CPU usage for a given URL, which is a signal that inversely correlates with ad performance. CPU usage is measured in seconds.

High CPU usage indicates resource-intensive pages that can slow down devices and drain battery life, particularly on mobile devices. Lower CPU usage ensures better user experience, improved ad performance, and supports accessibility across different device capabilities and internet speeds.

---

<a id="total-supply-paths"></a>

### total_supply_paths

The total number of supply paths an ad takes from the advertiser to the publisher's website or app where it is displayed. It includes the series of intermediaries involved in the selling and delivery of the ad inventory, such as ad exchanges, SSPs, and other resellers.

Multiple supply paths can increase costs and reduce transparency in the advertising supply chain. Publishers with fewer, more direct supply paths offer better value for advertisers and clearer attribution, promoting a more efficient and trustworthy programmatic advertising ecosystem.

---

<a id="reseller-count"></a>

### reseller_count

Number of resellers or intermediaries involved in the publisher's advertising supply chain.

Fewer intermediaries mean lower fees, better transparency, and more revenue flowing to content creators. Publishers with streamlined supply chains offer better value to advertisers and contribute to a more direct, efficient, and sustainable advertising ecosystem that benefits both buyers and sellers.

---

<a id="slug"></a>

### slug

URL-friendly identifier or slug for the publisher.

---

<a id="domain"></a>

### domain

The actual domain where the ads.txt file is hosted. This may be a subdomain or different from the owner domain in cases where the publisher operates multiple properties or uses subdomains for different content sections.

---

<a id="parent-entity-id"></a>

### parent_entity_id

The identifier of the parent entity that owns or controls this publisher. This is useful for understanding corporate relationships and ownership structures in the advertising ecosystem.

---

<a id="similar-publishers"></a>

### similar_publishers

A curated list of publishers that OpenSincera considers similar to the current publisher, based on shared attributes (e.g., content category/editorial focus) and observed supply-side patterns.

This list is meant for contextual benchmarking—not a definitive competitor set. Use it to compare key signals across comparable publishers and to interpret a publisher's metrics in a relevant market/content context.

---
